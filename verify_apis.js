const axios = require('axios');
const { faker } = require('@faker-js/faker'); // Optional: using faker if available, else standard random
require('dotenv').config();

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
let tenantAdminToken = '';
let tenantId = '';
let projectId = '';
let taskId = '';
let userId = '';

// Helper for colored logs
const log = (msg, type = 'info') => {
    const colors = {
        info: '\x1b[36m', // Cyan
        success: '\x1b[32m', // Green
        error: '\x1b[31m', // Red
        reset: '\x1b[0m'
    };
    console.log(`${colors[type]}[${type.toUpperCase()}] ${msg}${colors.reset}`);
};

const runVerification = async () => {
    try {
        log('Starting API Verification Sequence...');

        // 1. Register Tenant
        const orgName = `TestOrg_${Date.now()}`;
        const subdomain = `test${Date.now()}`;
        const adminEmail = `admin${Date.now()}@test.com`;
        const adminPassword = 'Password@123';

        log(`1. Testing Tenant Registration (${subdomain})...`);
        try {
            const regRes = await axios.post(`${API_URL}/auth/register-tenant`, {
                tenantName: orgName,
                subdomain: subdomain,
                adminFullName: 'Test Admin',
                adminEmail: adminEmail,
                adminPassword: adminPassword
            });
            if (regRes.data.success) {
                log('   Tenant Registration Successful', 'success');
            }
        } catch (e) {
            log(`   Registration Failed: ${e.message}`, 'error');
            throw e;
        }

        // 2. Login
        log('2. Testing Login...');
        try {
            const loginRes = await axios.post(`${API_URL}/auth/login`, {
                email: adminEmail,
                password: adminPassword
            });
            if (loginRes.data.success) {
                tenantAdminToken = loginRes.data.data.token;
                tenantId = loginRes.data.data.user.tenantId;
                log('   Login Successful. Token received.', 'success');
            }
        } catch (e) {
            log(`   Login Failed: ${e.message}`, 'error');
            throw e;
        }

        const authHeaders = { headers: { Authorization: `Bearer ${tenantAdminToken}` } };

        // 3. Create Project
        log('3. Testing Create Project...');
        try {
            const projRes = await axios.post(`${API_URL}/projects`, {
                name: 'API Verification Project',
                description: 'Created by automated script'
            }, authHeaders);
            if (projRes.data.success) {
                projectId = projRes.data.data.id;
                log(`   Project Created: ${projectId}`, 'success');
            }
        } catch (e) {
            log(`   Create Project Failed: ${e.message}`, 'error');
        }

        // 4. Create Task
        if (projectId) {
            log('4. Testing Create Task...');
            try {
                const taskRes = await axios.post(`${API_URL}/projects/${projectId}/tasks`, {
                    title: 'Verify APIs',
                    priority: 'high',
                    description: 'Automated task'
                }, authHeaders);
                if (taskRes.data.success) {
                    taskId = taskRes.data.data.id;
                    log(`   Task Created: ${taskId}`, 'success');
                }
            } catch (e) {
                log(`   Create Task Failed: ${e.message}`, 'error');
            }
        }

        // 5. Add User
        log('5. Testing Add User...');
        try {
            const userEmail = `user${Date.now()}@test.com`;
            const userRes = await axios.post(`${API_URL}/tenants/${tenantId}/users`, {
                fullName: 'Test User',
                email: userEmail,
                password: 'User@123',
                role: 'user'
            }, authHeaders);
            if (userRes.data.success) {
                userId = userRes.data.data.id;
                log(`   User Created: ${userId}`, 'success');
            }
        } catch (e) {
            log(`   Add User Failed: ${e.message}`, 'error');
        }

        // 6. Delete User
        if (userId) {
            log('6. Testing Delete User...');
            try {
                await axios.delete(`${API_URL}/users/${userId}`, authHeaders);
                log('   User Deleted Successfully', 'success');
            } catch (e) {
                log(`   Delete User Failed: ${e.message}`, 'error');
            }
        }

        log('API Verification Complete! All systems go.', 'success');

    } catch (error) {
        log(`CRITICAL ERROR: ${error.message}`, 'error');
        process.exit(1);
    }
};

runVerification();
