const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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

// @desc    Register a new tenant
// @route   POST /api/auth/register-tenant
// @access  Public
exports.registerTenant = asyncHandler(async (req, res) => {
    const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = req.body;

    // Basic Validation
    if (!tenantName || !subdomain || !adminEmail || !adminPassword || !adminFullName) {
        return apiResponse(res, 400, false, 'All fields are required');
    }

    // Validate Subdomain format (alphanumeric)
    const subdomainRegex = /^[a-z0-9-]+$/;
    if (!subdomainRegex.test(subdomain)) {
        return apiResponse(res, 400, false, 'Invalid subdomain format');
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check if subdomain exists
        const tenantCheck = await client.query('SELECT id FROM tenants WHERE subdomain = $1', [subdomain]);
        if (tenantCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return apiResponse(res, 409, false, 'Subdomain already exists');
        }

        // Check if email exists in this proposed tenant (though it's new, so techincally empty, 
        // but just checking if we can create the user later. Actually email is unique per tenant.
        // Since tenant is new, no users exist. Logic is fine.

        // Create Tenant
        const newTenant = await client.query(
            `INSERT INTO tenants (name, subdomain, status, subscription_plan, max_users, max_projects)
       VALUES ($1, $2, 'active', 'free', 5, 3)
       RETURNING id, subdomain`,
            [tenantName, subdomain]
        );
        const tenantId = newTenant.rows[0].id;

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        // Create Admin User
        const newUser = await client.query(
            `INSERT INTO users (tenant_id, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, 'tenant_admin')
       RETURNING id, email, full_name, role`,
            [tenantId, adminEmail, hashedPassword, adminFullName]
        );

        await client.query('COMMIT');

        // Audit Log (system action)
        logAudit(tenantId, newUser.rows[0].id, 'REGISTER_TENANT', 'tenant', tenantId, req.ip);

        return apiResponse(res, 201, true, 'Tenant registered successfully', {
            tenantId: tenantId,
            subdomain: newTenant.rows[0].subdomain,
            adminUser: newUser.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        return apiResponse(res, 500, false, 'Server Error during registration');
    } finally {
        client.release();
    }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
    const { email, password, tenantSubdomain } = req.body;

    if (!email || !password) {
        return apiResponse(res, 400, false, 'Email and password are required');
    }

    // 1. Determine Tenant
    let tenantId = null;

    // If verifying Super Admin, they have NULL tenant_id.
    // But usually Super Admins login via a specific portal or just generic login.
    // The spec says: "Super Admin Exception: Super admin users have tenant_id as NULL"
    // And "API 2: User Login... Request Body: tenantSubdomain OR tenantId"

    const client = await pool.connect();
    try {
        let userQuery;
        let userParams;
        let tenantDetails = null;

        if (tenantSubdomain) {
            // Find tenant
            const tenantRes = await client.query('SELECT id, status FROM tenants WHERE subdomain = $1', [tenantSubdomain]);
            if (tenantRes.rows.length === 0) {
                return apiResponse(res, 404, false, 'Tenant not found');
            }
            tenantDetails = tenantRes.rows[0];

            if (tenantDetails.status !== 'active') {
                return apiResponse(res, 403, false, 'Tenant account is not active');
            }

            tenantId = tenantDetails.id;

            // Find user in this tenant
            userQuery = 'SELECT * FROM users WHERE email = $1 AND tenant_id = $2';
            userParams = [email, tenantId];
        } else {
            // Try to find if user is Super Admin (tenant_id is NULL)
            userQuery = 'SELECT * FROM users WHERE email = $1 AND tenant_id IS NULL AND role = \'super_admin\'';
            userParams = [email];
        }

        const userRes = await client.query(userQuery, userParams);

        // If not found in tenant/superadmin, checking fail.
        if (userRes.rows.length === 0) {
            // Fallback: If no tenantSubdomain provided, maybe they are a superadmin logging in?
            // But if they provided a subdomain and user not found, strict fail.
            return apiResponse(res, 401, false, 'Invalid credentials');
        }

        const user = userRes.rows[0];

        // Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return apiResponse(res, 401, false, 'Invalid credentials');
        }

        // Check active status
        if (!user.is_active) {
            return apiResponse(res, 403, false, 'Account is deactivated');
        }

        // Generate Token
        const payload = {
            userId: user.id,
            tenantId: user.tenant_id, // can be null for super_admin
            role: user.role
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

        // Internal User Object to return
        const userObj = {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role,
            tenantId: user.tenant_id
        };

        // Audit Log
        logAudit(user.tenant_id, user.id, 'LOGIN', 'user', user.id, req.ip);

        return apiResponse(res, 200, true, 'Login successful', {
            user: userObj,
            token,
            expiresIn: 86400 // 24 hours
        });

    } catch (error) {
        console.error(error);
        return apiResponse(res, 500, false, 'Server Error');
    } finally {
        client.release();
    }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
    // req.user is set by auth middleware
    const { userId, tenantId, role } = req.user;

    const client = await pool.connect();
    try {
        const userRes = await client.query('SELECT id, email, full_name, role, is_active, tenant_id FROM users WHERE id = $1', [userId]);
        if (userRes.rows.length === 0) {
            return apiResponse(res, 404, false, 'User not found');
        }
        const user = userRes.rows[0];

        let tenantData = null;
        if (user.tenant_id) {
            const tenantRes = await client.query('SELECT id, name, subdomain, subscription_plan, max_users, max_projects, status FROM tenants WHERE id = $1', [user.tenant_id]);
            if (tenantRes.rows.length > 0) {
                tenantData = tenantRes.rows[0];
            }
        }

        return apiResponse(res, 200, true, 'User profile', {
            ...user,
            tenant: tenantData
        });

    } catch (err) {
        console.error(err);
        return apiResponse(res, 500, false, 'Server Error');
    } finally {
        client.release();
    }
});

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res) => {
    // JWT is stateless, so we just return success. 
    // Client should remove token.
    if (req.user) {
        logAudit(req.user.tenantId, req.user.userId, 'LOGOUT', 'user', req.user.userId, req.ip);
    }
    return apiResponse(res, 200, true, 'Logged out successfully');
});
