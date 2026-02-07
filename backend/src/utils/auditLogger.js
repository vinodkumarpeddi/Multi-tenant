const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

/**
 * Log an action to the audit_logs table
 * @param {string} tenantId - The tenant ID
 * @param {string} userId - The user ID who performed the action (can be null for system actions)
 * @param {string} action - The action name (e.g., 'CREATE_USER')
 * @param {string} entityType - The type of entity affected (e.g., 'user', 'project')
 * @param {string} entityId - The ID of the affected entity
 * @param {string} ipAddress - The IP address of the requester
 */
const logAudit = async (tenantId, userId, action, entityType, entityId, ipAddress) => {
    try {
        const query = `
      INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
        await pool.query(query, [tenantId, userId, action, entityType, entityId, ipAddress]);
    } catch (error) {
        console.error('Audit Log Error:', error);
        // Don't throw error to prevent blocking the main request
    }
};

module.exports = logAudit;
