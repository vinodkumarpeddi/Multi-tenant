const bcrypt = require('bcryptjs');
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

// @desc    Add User to Tenant
// @route   POST /api/tenants/:tenantId/users
// @access  Private (Tenant Admin)
exports.addUser = asyncHandler(async (req, res) => {
    const { tenantId } = req.params;
    const { tenantId: userTenantId, role: userRole, userId: currentUserId } = req.user;
    const { email, password, fullName, role } = req.body;

    // Authorization
    if (userRole !== 'tenant_admin' || userTenantId !== tenantId) {
        return apiResponse(res, 403, false, 'Not authorized');
    }

    // Validation
    if (!email || !password || !fullName) {
        return apiResponse(res, 400, false, 'Email, password, and name are required');
    }

    if (password.length < 8) {
        return apiResponse(res, 400, false, 'Password must be at least 8 characters');
    }

    // Only allow creating 'user' or 'tenant_admin'
    const validRoles = ['user', 'tenant_admin'];
    const newRole = role || 'user';
    if (!validRoles.includes(newRole)) {
        return apiResponse(res, 400, false, 'Invalid role');
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check subscription limits
        const tenantRes = await client.query('SELECT max_users FROM tenants WHERE id = $1', [tenantId]);
        const maxUsers = tenantRes.rows[0].max_users;

        const countRes = await client.query('SELECT COUNT(*) FROM users WHERE tenant_id = $1', [tenantId]);
        const currentUserCount = parseInt(countRes.rows[0].count);

        if (currentUserCount >= maxUsers) {
            await client.query('ROLLBACK');
            return apiResponse(res, 403, false, 'Subscription user limit reached');
        }

        // Check if email exists in tenant
        const userCheck = await client.query(
            'SELECT id FROM users WHERE tenant_id = $1 AND email = $2',
            [tenantId, email]
        );
        if (userCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return apiResponse(res, 409, false, 'Email already exists in this tenant');
        }

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create User
        const newUserQuery = `
            INSERT INTO users (tenant_id, email, password_hash, full_name, role, is_active)
            VALUES ($1, $2, $3, $4, $5, true)
            RETURNING id, email, full_name, role, tenant_id, is_active, created_at
        `;
        const newUser = await client.query(newUserQuery, [tenantId, email, hashedPassword, fullName, newRole]);

        await client.query('COMMIT');

        logAudit(tenantId, currentUserId, 'CREATE_USER', 'user', newUser.rows[0].id, req.ip);

        return apiResponse(res, 201, true, 'User created successfully', newUser.rows[0]);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        return apiResponse(res, 500, false, 'Server Error');
    } finally {
        client.release();
    }
});

// @desc    List Tenant Users
// @route   GET /api/tenants/:tenantId/users
// @access  Private (Tenant Member)
exports.listUsers = asyncHandler(async (req, res) => {
    const { tenantId } = req.params;
    const { tenantId: userTenantId, role: userRole } = req.user;
    const { search, role, page = 1, limit = 50 } = req.query;

    // Authorization: User must belong to tenant
    if (userTenantId !== tenantId) {
        return apiResponse(res, 403, false, 'Not authorized');
    }

    const offset = (page - 1) * limit;
    const values = [tenantId];
    let idx = 2;
    let whereClause = ['tenant_id = $1'];

    if (search) {
        whereClause.push(`(email ILIKE $${idx} OR full_name ILIKE $${idx})`);
        values.push(`%${search}%`);
        idx++;
    }

    if (role) {
        whereClause.push(`role = $${idx}`);
        values.push(role);
        idx++;
    }

    const whereString = 'WHERE ' + whereClause.join(' AND ');

    const client = await pool.connect();
    try {
        const countQuery = `SELECT COUNT(*) FROM users ${whereString}`;
        const countRes = await client.query(countQuery, values);
        const total = parseInt(countRes.rows[0].count);

        const listQuery = `
            SELECT id, email, full_name, role, is_active, created_at 
            FROM users 
            ${whereString}
            ORDER BY created_at DESC
            LIMIT $${idx} OFFSET $${idx + 1}
        `;

        const listValues = [...values, limit, offset];
        const users = await client.query(listQuery, listValues);

        return apiResponse(res, 200, true, 'Users list', {
            users: users.rows,
            total,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
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

// @desc    Update User
// @route   PUT /api/users/:userId
// @access  Private (Tenant Admin or Self)
exports.updateUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { tenantId: userTenantId, role: userRole, userId: currentUserId } = req.user;
    const { fullName, role, isActive } = req.body;

    const client = await pool.connect();
    try {
        // Get target user to verify tenant
        const targetRes = await client.query('SELECT tenant_id FROM users WHERE id = $1', [userId]);
        if (targetRes.rows.length === 0) {
            return apiResponse(res, 404, false, 'User not found');
        }
        const targetUser = targetRes.rows[0];

        // Authorization: Must be in same tenant
        if (userTenantId !== targetUser.tenant_id) {
            return apiResponse(res, 403, false, 'Not authorized');
        }

        // Permissions check
        const isSelf = userId === currentUserId;
        const isAdmin = userRole === 'tenant_admin';

        if (!isSelf && !isAdmin) {
            return apiResponse(res, 403, false, 'Not authorized');
        }

        const updates = [];
        const values = [];
        let idx = 1;

        // Allow self update of name
        if (fullName) {
            updates.push(`full_name = $${idx}`);
            values.push(fullName);
            idx++;
        }

        // Only admin can update role and status
        if (isAdmin) {
            if (role && role !== 'super_admin') { // prevent creating super_admin
                updates.push(`role = $${idx}`);
                values.push(role);
                idx++;
            }
            if (isActive !== undefined) {
                updates.push(`is_active = $${idx}`);
                values.push(isActive);
                idx++;
            }
        } else if (role || isActive !== undefined) {
            return apiResponse(res, 403, false, 'Only admins can update role/status');
        }

        updates.push(`updated_at = NOW()`);

        if (updates.length > 1) {
            values.push(userId);
            const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, email, full_name, role, is_active, updated_at`;
            const result = await client.query(query, values);

            logAudit(userTenantId, currentUserId, 'UPDATE_USER', 'user', userId, req.ip);

            return apiResponse(res, 200, true, 'User updated successfully', result.rows[0]);
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

// @desc    Delete User
// @route   DELETE /api/users/:userId
// @access  Private (Tenant Admin)
exports.deleteUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { tenantId: userTenantId, role: userRole, userId: currentUserId } = req.user;

    if (userRole !== 'tenant_admin') {
        return apiResponse(res, 403, false, 'Not authorized');
    }

    if (userId === currentUserId) {
        return apiResponse(res, 403, false, 'Cannot delete yourself');
    }

    const client = await pool.connect();
    try {
        const targetRes = await client.query('SELECT tenant_id FROM users WHERE id = $1', [userId]);
        if (targetRes.rows.length === 0) {
            return apiResponse(res, 404, false, 'User not found');
        }
        if (targetRes.rows[0].tenant_id !== userTenantId) {
            return apiResponse(res, 403, false, 'Not authorized');
        }

        await client.query('BEGIN');

        // Cascade handling: Set tasks assigned to this user to NULL
        await client.query('UPDATE tasks SET assigned_to = NULL WHERE assigned_to = $1', [userId]);

        // Handle Created Projects? The spec says "Cascade delete related data OR set assigned_to to NULL".
        // Projects created by user should probably keep existing but created_by set to NULL or converted.
        await client.query('UPDATE projects SET created_by = NULL WHERE created_by = $1', [userId]);

        // Delete User
        await client.query('DELETE FROM users WHERE id = $1', [userId]);

        await client.query('COMMIT');

        logAudit(userTenantId, currentUserId, 'DELETE_USER', 'user', userId, req.ip);

        return apiResponse(res, 200, true, 'User deleted successfully');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        return apiResponse(res, 500, false, 'Server Error');
    } finally {
        client.release();
    }
});
