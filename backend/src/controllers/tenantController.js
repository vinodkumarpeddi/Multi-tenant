const { Pool } = require('pg');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');
const logAudit = require('../utils/auditLogger');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

// @desc    Get Tenant Details
// @route   GET /api/tenants/:tenantId
// @access  Private (Tenant Admin or Super Admin)
exports.getTenant = asyncHandler(async (req, res) => {
    const { tenantId } = req.params;
    const { tenantId: userTenantId, role } = req.user;

    // Authorization
    if (role !== 'super_admin' && userTenantId !== tenantId) {
        return apiResponse(res, 403, false, 'Not authorized to access this tenant');
    }

    const client = await pool.connect();
    try {
        const tenantRes = await client.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
        if (tenantRes.rows.length === 0) {
            return apiResponse(res, 404, false, 'Tenant not found');
        }
        const tenant = tenantRes.rows[0];

        // Stats
        const usersCount = await client.query('SELECT COUNT(*) FROM users WHERE tenant_id = $1', [tenantId]);
        const projectsCount = await client.query('SELECT COUNT(*) FROM projects WHERE tenant_id = $1', [tenantId]);
        const tasksCount = await client.query('SELECT COUNT(*) FROM tasks WHERE tenant_id = $1', [tenantId]);

        return apiResponse(res, 200, true, 'Tenant details', {
            ...tenant,
            stats: {
                totalUsers: parseInt(usersCount.rows[0].count),
                totalProjects: parseInt(projectsCount.rows[0].count),
                totalTasks: parseInt(tasksCount.rows[0].count)
            }
        });

    } catch (err) {
        console.error(err);
        return apiResponse(res, 500, false, 'Server Error');
    } finally {
        client.release();
    }
});

// @desc    Update Tenant
// @route   PUT /api/tenants/:tenantId
// @access  Private (Tenant Admin [limited] or Super Admin [full])
exports.updateTenant = asyncHandler(async (req, res) => {
    const { tenantId } = req.params;
    const { tenantId: userTenantId, role, userId } = req.user;
    const { name, status, subscriptionPlan, maxUsers, maxProjects } = req.body;

    // Authorization
    if (role !== 'super_admin' && userTenantId !== tenantId) {
        return apiResponse(res, 403, false, 'Not authorized');
    }

    // Role-based restrictions
    if (role === 'tenant_admin') {
        if (status || subscriptionPlan || maxUsers || maxProjects) {
            return apiResponse(res, 403, false, 'Tenant admins can only update name');
        }
    }

    const client = await pool.connect();
    try {
        // Build dynamic query
        const updates = [];
        const values = [];
        let idx = 1;

        if (name) {
            updates.push(`name = $${idx}`);
            values.push(name);
            idx++;
        }

        if (role === 'super_admin') {
            if (status) { updates.push(`status = $${idx}`); values.push(status); idx++; }
            if (subscriptionPlan) { updates.push(`subscription_plan = $${idx}`); values.push(subscriptionPlan); idx++; }
            if (maxUsers) { updates.push(`max_users = $${idx}`); values.push(maxUsers); idx++; }
            if (maxProjects) { updates.push(`max_projects = $${idx}`); values.push(maxProjects); idx++; }
        }

        updates.push(`updated_at = NOW()`);

        if (updates.length > 1) { // 1 because updated_at is always there
            values.push(tenantId);
            const query = `UPDATE tenants SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
            const result = await client.query(query, values);

            if (result.rows.length === 0) {
                return apiResponse(res, 404, false, 'Tenant not found');
            }

            logAudit(tenantId, userId, 'UPDATE_TENANT', 'tenant', tenantId, req.ip);

            return apiResponse(res, 200, true, 'Tenant updated successfully', result.rows[0]);
        } else {
            return apiResponse(res, 200, true, 'No changes made');
        }

    } catch (err) {
        console.error(err);
        return apiResponse(res, 500, false, 'Server Error');
    } finally {
        client.release();
    }
});

// @desc    List All Tenants
// @route   GET /api/tenants
// @access  Private (Super Admin Only)
exports.listTenants = asyncHandler(async (req, res) => {
    const { role } = req.user;
    const { page = 1, limit = 10, status, subscriptionPlan } = req.query;

    if (role !== 'super_admin') {
        return apiResponse(res, 403, false, 'Not authorized');
    }

    const offset = (page - 1) * limit;
    const values = [];
    let idx = 1;
    let whereClause = [];

    if (status) {
        whereClause.push(`status = $${idx}`);
        values.push(status);
        idx++;
    }
    if (subscriptionPlan) {
        whereClause.push(`subscription_plan = $${idx}`);
        values.push(subscriptionPlan);
        idx++;
    }

    const whereString = whereClause.length > 0 ? 'WHERE ' + whereClause.join(' AND ') : '';

    const client = await pool.connect();
    try {
        const countQuery = `SELECT COUNT(*) FROM tenants ${whereString}`;
        const countRes = await client.query(countQuery, values);
        const total = parseInt(countRes.rows[0].count);

        const listQuery = `
            SELECT t.*, 
            (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id) as total_users,
            (SELECT COUNT(*) FROM projects p WHERE p.tenant_id = t.id) as total_projects
            FROM tenants t
            ${whereString}
            ORDER BY created_at DESC
            LIMIT $${idx} OFFSET $${idx + 1}
        `;

        const listValues = [...values, limit, offset];
        const tenants = await client.query(listQuery, listValues);

        return apiResponse(res, 200, true, 'Tenants list', {
            tenants: tenants.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalTenants: total,
                limit: parseInt(limit)
            }
        });

    } catch (err) {
        console.error(err);
        return apiResponse(res, 500, false, 'Server Error');
    } finally {
        client.release();
    }
});
