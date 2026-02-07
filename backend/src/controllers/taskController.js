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

// @desc    Create Task
// @route   POST /api/projects/:projectId/tasks
// @access  Private
exports.createTask = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { tenantId, userId } = req.user;
    const { title, description, assignedTo, priority, dueDate } = req.body;

    if (!title) {
        return apiResponse(res, 400, false, 'Task title is required');
    }

    const client = await pool.connect();
    try {
        // Verify project exists and belongs to tenant
        const projectRes = await client.query('SELECT tenant_id FROM projects WHERE id = $1', [projectId]);
        if (projectRes.rows.length === 0) {
            return apiResponse(res, 404, false, 'Project not found');
        }
        if (projectRes.rows[0].tenant_id !== tenantId) {
            return apiResponse(res, 403, false, 'Not authorized');
        }

        // Verify assigned user belongs to tenant
        if (assignedTo) {
            const userCheck = await client.query('SELECT tenant_id FROM users WHERE id = $1', [assignedTo]);
            if (userCheck.rows.length === 0 || userCheck.rows[0].tenant_id !== tenantId) {
                return apiResponse(res, 400, false, 'Assigned user does not belong to this tenant');
            }
        }

        const query = `
            INSERT INTO tasks (project_id, tenant_id, title, description, status, priority, assigned_to, due_date)
            VALUES ($1, $2, $3, $4, 'todo', $5, $6, $7)
            RETURNING *
        `;
        // Default priority medium
        const p = priority || 'medium';
        const values = [projectId, tenantId, title, description, p, assignedTo || null, dueDate || null];
        const result = await client.query(query, values);

        logAudit(tenantId, userId, 'CREATE_TASK', 'task', result.rows[0].id, req.ip);

        return apiResponse(res, 201, true, 'Task created successfully', result.rows[0]);

    } catch (err) {
        console.error(err);
        return apiResponse(res, 500, false, 'Server Error');
    } finally {
        client.release();
    }
});

// @desc    List Project Tasks
// @route   GET /api/projects/:projectId/tasks
// @access  Private
exports.listTasks = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { tenantId } = req.user;
    const { status, assignedTo, priority, search, page = 1, limit = 50 } = req.query;

    const offset = (page - 1) * limit;
    const values = [projectId, tenantId]; // 1, 2
    let idx = 3;
    let whereClause = ['project_id = $1', 'tenant_id = $2']; // using tenant_id for double safety/index

    if (status) { whereClause.push(`status = $${idx}`); values.push(status); idx++; }
    if (assignedTo) { whereClause.push(`assigned_to = $${idx}`); values.push(assignedTo); idx++; }
    if (priority) { whereClause.push(`priority = $${idx}`); values.push(priority); idx++; }
    if (search) { whereClause.push(`title ILIKE $${idx}`); values.push(`%${search}%`); idx++; }

    const whereString = 'WHERE ' + whereClause.join(' AND ');

    const client = await pool.connect();
    try {
        // First check access to project? Query implicitly does it by tenant_id check.

        const countQuery = `SELECT COUNT(*) FROM tasks ${whereString}`;
        const countRes = await client.query(countQuery, values);
        const total = parseInt(countRes.rows[0].count);

        const listQuery = `
            SELECT t.*,
            u.full_name as assigned_user_name,
            u.email as assigned_user_email
            FROM tasks t
            LEFT JOIN users u ON t.assigned_to = u.id
            ${whereString}
            ORDER BY 
              CASE WHEN priority = 'high' THEN 1 WHEN priority = 'medium' THEN 2 ELSE 3 END,
              due_date ASC NULLS LAST
            LIMIT $${idx} OFFSET $${idx + 1}
        `;

        const listValues = [...values, limit, offset];
        const tasks = await client.query(listQuery, listValues);

        const formattedTasks = tasks.rows.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            assignedTo: t.assigned_to ? {
                id: t.assigned_to,
                fullName: t.assigned_user_name,
                email: t.assigned_user_email
            } : null,
            dueDate: t.due_date,
            createdAt: t.created_at
        }));

        return apiResponse(res, 200, true, 'Tasks list', {
            tasks: formattedTasks,
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

// @desc    Update Task Status
// @route   PATCH /api/tasks/:taskId/status
// @access  Private
exports.updateTaskStatus = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const { tenantId, userId } = req.user;
    const { status } = req.body;

    if (!status) return apiResponse(res, 400, false, 'Status is required');

    const client = await pool.connect();
    try {
        const taskRes = await client.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
        if (taskRes.rows.length === 0) return apiResponse(res, 404, false, 'Task not found');

        if (taskRes.rows[0].tenant_id !== tenantId) return apiResponse(res, 403, false, 'Not authorized');

        const result = await client.query(
            'UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, status, updated_at',
            [status, taskId]
        );

        logAudit(tenantId, userId, 'UPDATE_TASK_STATUS', 'task', taskId, req.ip);

        return apiResponse(res, 200, true, 'Task status updated', {
            id: result.rows[0].id,
            status: result.rows[0].status,
            updatedAt: result.rows[0].updated_at
        });
    } catch (err) {
        console.error(err);
        return apiResponse(res, 500, false, 'Server Error');
    } finally {
        client.release();
    }
});

// @desc    Update Task
// @route   PUT /api/tasks/:taskId
// @access  Private
exports.updateTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const { tenantId, userId } = req.user;
    const { title, description, status, priority, assignedTo, dueDate } = req.body;

    const client = await pool.connect();
    try {
        const taskRes = await client.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
        if (taskRes.rows.length === 0) return apiResponse(res, 404, false, 'Task not found');

        if (taskRes.rows[0].tenant_id !== tenantId) return apiResponse(res, 403, false, 'Not authorized');

        // Validate assignedTo if provided
        if (assignedTo) {
            const userCheck = await client.query('SELECT tenant_id FROM users WHERE id = $1', [assignedTo]);
            if (userCheck.rows.length === 0 || userCheck.rows[0].tenant_id !== tenantId) {
                return apiResponse(res, 400, false, 'Assigned user does not belong to this tenant');
            }
        }

        const updates = [];
        const values = [];
        let idx = 1;

        if (title) { updates.push(`title = $${idx}`); values.push(title); idx++; }
        if (description !== undefined) { updates.push(`description = $${idx}`); values.push(description); idx++; }
        if (status) { updates.push(`status = $${idx}`); values.push(status); idx++; }
        if (priority) { updates.push(`priority = $${idx}`); values.push(priority); idx++; }

        // Handle unassign (null)
        if (assignedTo !== undefined) {
            updates.push(`assigned_to = $${idx}`);
            values.push(assignedTo);
            idx++;
        }

        if (dueDate !== undefined) {
            updates.push(`due_date = $${idx}`);
            values.push(dueDate);
            idx++;
        }

        updates.push(`updated_at = NOW()`);

        if (updates.length > 1) {
            values.push(taskId);
            const query = `
                 UPDATE tasks SET ${updates.join(', ')} 
                 WHERE id = $${idx} 
                 RETURNING *
             `;
            const result = await client.query(query, values);

            // Fetch assigned user details for response
            let assignedUser = null;
            if (result.rows[0].assigned_to) {
                const uRes = await client.query('SELECT id, full_name, email FROM users WHERE id = $1', [result.rows[0].assigned_to]);
                if (uRes.rows.length > 0) assignedUser = uRes.rows[0];
            }

            const t = result.rows[0];
            const formattedTask = {
                id: t.id,
                title: t.title,
                description: t.description,
                status: t.status,
                priority: t.priority,
                assignedTo: assignedUser ? {
                    id: assignedUser.id,
                    fullName: assignedUser.full_name,
                    email: assignedUser.email
                } : null,
                dueDate: t.due_date,
                updatedAt: t.updated_at
            };

            logAudit(tenantId, userId, 'UPDATE_TASK', 'task', taskId, req.ip);

            return apiResponse(res, 200, true, 'Task updated successfully', formattedTask);
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

// @desc    Delete Task
// @route   DELETE /api/tasks/:taskId
// @access  Private
exports.deleteTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const { tenantId, userId } = req.user;

    const client = await pool.connect();
    try {
        const taskRes = await client.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
        if (taskRes.rows.length === 0) return apiResponse(res, 404, false, 'Task not found');

        if (taskRes.rows[0].tenant_id !== tenantId) return apiResponse(res, 403, false, 'Not authorized');

        await client.query('DELETE FROM tasks WHERE id = $1', [taskId]);

        logAudit(tenantId, userId, 'DELETE_TASK', 'task', taskId, req.ip);

        return apiResponse(res, 200, true, 'Task deleted successfully');

    } catch (err) {
        console.error(err);
        return apiResponse(res, 500, false, 'Server Error');
    } finally {
        client.release();
    }
});
