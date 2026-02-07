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

// @desc    Create Project
// @route   POST /api/projects
// @access  Private (User)
exports.createProject = asyncHandler(async (req, res) => {
    const { tenantId, userId } = req.user;
    const { name, description, status } = req.body;

    if (!name) {
        return apiResponse(res, 400, false, 'Project name is required');
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check subscription limits
        const tenantRes = await client.query('SELECT max_projects FROM tenants WHERE id = $1', [tenantId]);
        const maxProjects = tenantRes.rows[0].max_projects;

        const countRes = await client.query('SELECT COUNT(*) FROM projects WHERE tenant_id = $1', [tenantId]);
        const currentProjectCount = parseInt(countRes.rows[0].count);

        if (currentProjectCount >= maxProjects) {
            await client.query('ROLLBACK');
            return apiResponse(res, 403, false, 'Subscription project limit reached');
        }

        const query = `
            INSERT INTO projects (tenant_id, name, description, status, created_by)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, tenant_id, name, description, status, created_by, created_at
        `;
        const values = [tenantId, name, description || null, status || 'active', userId];
        const result = await client.query(query, values);

        await client.query('COMMIT');

        logAudit(tenantId, userId, 'CREATE_PROJECT', 'project', result.rows[0].id, req.ip);

        return apiResponse(res, 201, true, 'Project created successfully', result.rows[0]);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        return apiResponse(res, 500, false, 'Server Error');
    } finally {
        client.release();
    }
});

// @desc    List Projects
// @route   GET /api/projects
// @access  Private (User)
exports.listProjects = asyncHandler(async (req, res) => {
    const { tenantId } = req.user;
    const { status, search, page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;
    const values = [tenantId];
    let idx = 2;
    let whereClause = ['p.tenant_id = $1'];

    if (status) {
        whereClause.push(`p.status = $${idx}`);
        values.push(status);
        idx++;
    }

    if (search) {
        whereClause.push(`p.name ILIKE $${idx}`);
        values.push(`%${search}%`);
        idx++;
    }

    const whereString = 'WHERE ' + whereClause.join(' AND ');

    const client = await pool.connect();
    try {
        const countQuery = `SELECT COUNT(*) FROM projects p ${whereString}`;
        const countRes = await client.query(countQuery, values);
        const total = parseInt(countRes.rows[0].count);

        const listQuery = `
            SELECT p.*, 
            u.full_name as created_by_name,
            (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
            (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'completed') as completed_task_count
            FROM projects p
            LEFT JOIN users u ON p.created_by = u.id
            ${whereString}
            ORDER BY p.created_at DESC
            LIMIT $${idx} OFFSET $${idx + 1}
        `;

        const listValues = [...values, limit, offset];
        const projects = await client.query(listQuery, listValues);

        // Format created_by object to match spec
        const formattedProjects = projects.rows.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            status: p.status,
            createdBy: {
                id: p.created_by,
                fullName: p.created_by_name
            },
            taskCount: parseInt(p.task_count),
            completedTaskCount: parseInt(p.completed_task_count),
            createdAt: p.created_at
        }));

        return apiResponse(res, 200, true, 'Projects list', {
            projects: formattedProjects,
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

// @desc    Get Project Details
// @route   GET /api/projects/:projectId
// @access  Private (User)
exports.getProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { tenantId } = req.user;

    const client = await pool.connect();
    try {
        const query = `
            SELECT p.*, u.full_name as created_by_name
            FROM projects p
            LEFT JOIN users u ON p.created_by = u.id
            WHERE p.id = $1 AND p.tenant_id = $2
        `;
        const result = await client.query(query, [projectId, tenantId]);

        if (result.rows.length === 0) {
            return apiResponse(res, 404, false, 'Project not found');
        }

        const p = result.rows[0];
        const formattedProject = {
            id: p.id,
            name: p.name,
            description: p.description,
            status: p.status,
            createdBy: {
                id: p.created_by,
                fullName: p.created_by_name
            },
            createdAt: p.created_at
        };

        return apiResponse(res, 200, true, 'Project details', formattedProject);

    } catch (err) {
        console.error(err);
        return apiResponse(res, 500, false, 'Server Error');
    } finally {
        client.release();
    }
});

// @desc    Update Project
// @route   PUT /api/projects/:projectId
// @access  Private (Tenant Admin or Creator)
exports.updateProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { tenantId: userTenantId, role: userRole, userId: currentUserId } = req.user;
    const { name, description, status } = req.body;

    const client = await pool.connect();
    try {
        const projectRes = await client.query('SELECT * FROM projects WHERE id = $1', [projectId]);
        if (projectRes.rows.length === 0) {
            return apiResponse(res, 404, false, 'Project not found');
        }
        const project = projectRes.rows[0];

        // Authorization: Same Tenant
        if (project.tenant_id !== userTenantId) {
            return apiResponse(res, 404, false, 'Project not found');
        }

        // Permission: Admin or Creator
        if (userRole !== 'tenant_admin' && project.created_by !== currentUserId) {
            return apiResponse(res, 403, false, 'Not authorized');
        }

        const updates = [];
        const values = [];
        let idx = 1;

        if (name) { updates.push(`name = $${idx}`); values.push(name); idx++; }
        if (description !== undefined) { updates.push(`description = $${idx}`); values.push(description); idx++; }
        if (status) { updates.push(`status = $${idx}`); values.push(status); idx++; }

        updates.push(`updated_at = NOW()`);

        if (updates.length > 1) {
            values.push(projectId);
            const query = `UPDATE projects SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
            const result = await client.query(query, values);

            logAudit(userTenantId, currentUserId, 'UPDATE_PROJECT', 'project', projectId, req.ip);

            return apiResponse(res, 200, true, 'Project updated successfully', result.rows[0]);
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

// @desc    Delete Project
// @route   DELETE /api/projects/:projectId
// @access  Private (Tenant Admin or Creator)
exports.deleteProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { tenantId: userTenantId, role: userRole, userId: currentUserId } = req.user;

    const client = await pool.connect();
    try {
        const projectRes = await client.query('SELECT * FROM projects WHERE id = $1', [projectId]);
        if (projectRes.rows.length === 0) {
            return apiResponse(res, 404, false, 'Project not found');
        }
        const project = projectRes.rows[0];

        if (project.tenant_id !== userTenantId) {
            return apiResponse(res, 404, false, 'Project not found');
        }

        if (userRole !== 'tenant_admin' && project.created_by !== currentUserId) {
            return apiResponse(res, 403, false, 'Not authorized');
        }

        // Cascade delete is handled by DB FK (ON DELETE CASCADE for tasks)
        // But let's be explicit if we want to log audit for tasks? 
        // No, DB ON DELETE CASCADE is sufficient as per requirements.

        await client.query('DELETE FROM projects WHERE id = $1', [projectId]);

        logAudit(userTenantId, currentUserId, 'DELETE_PROJECT', 'project', projectId, req.ip);

        return apiResponse(res, 200, true, 'Project deleted successfully');

    } catch (err) {
        console.error(err);
        return apiResponse(res, 500, false, 'Server Error');
    } finally {
        client.release();
    }
});
