const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function runSQLFile(filePath, replacements = {}) {
    let sql = fs.readFileSync(filePath, 'utf8');
    for (const [key, value] of Object.entries(replacements)) {
        sql = sql.replace(new RegExp(key, 'g'), value);
    }

    try {
        await pool.query(sql);
        console.log(`Executed: ${path.basename(filePath)}`);
    } catch (err) {
        // Ignore duplicate key errors for idempotency if strictly needed, 
        // but better to fix SQL to handle it (ON CONFLICT).
        console.log(`info: ${path.basename(filePath)} - ${err.message}`);
    }
}

async function initializeDatabase() {
    console.log('Starting Database Initialization...');

    // Wait for DB connection
    let retries = 10;
    while (retries > 0) {
        try {
            await pool.query('SELECT NOW()');
            console.log('Database connected.');
            break;
        } catch (err) {
            console.log(`Waiting for database... (${retries} left)`);
            retries--;
            await new Promise(res => setTimeout(res, 2000));
        }
    }

    if (retries === 0) {
        console.error('Could not connect to database.');
        process.exit(1);
    }

    // 1. Run Migrations
    const migrationsDir = path.join(__dirname, '../../migrations');
    if (fs.existsSync(migrationsDir)) {
        const files = fs.readdirSync(migrationsDir).sort();
        for (const file of files) {
            if (file.endsWith('.sql')) {
                await runSQLFile(path.join(migrationsDir, file));
            }
        }
    }

    // 2. Run Seeds
    const seedPath = path.join(__dirname, '../../seeds/seed_data.sql');
    if (fs.existsSync(seedPath)) {
        console.log('Seeding database...');

        // Generate hashes
        const superAdminHash = await bcrypt.hash('Admin@123', 10);
        const tenantAdminHash = await bcrypt.hash('Demo@123', 10);
        const userHash = await bcrypt.hash('User@123', 10);

        const replacements = {
            'HASH_SUPER_ADMIN': superAdminHash,
            'HASH_TENANT_ADMIN': tenantAdminHash,
            'HASH_USER': userHash
        };

        await runSQLFile(seedPath, replacements);
    }

    console.log('Database Initialization Complete.');
    pool.end();
}

if (require.main === module) {
    initializeDatabase();
}

module.exports = { initializeDatabase };
