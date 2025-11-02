#!/usr/bin/env node

/**
 * Database Setup Script
 * 
 * This script sets up the PostgreSQL database and user for the job application service.
 * It connects as the postgres superuser to create the database and user.
 */

const { Client } = require('pg');
require('dotenv').config();

const DB_NAME = process.env.DB_NAME || 'job_application_service';
const DB_USER = process.env.DB_USER || 'job_app_user';
const DB_PASSWORD = process.env.DB_PASSWORD || 'securepassword';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;

async function setupDatabase() {
    // Connect as postgres superuser (or any user with CREATEDB privilege)
    const superuserClient = new Client({
        host: DB_HOST,
        port: DB_PORT,
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgres',
        database: 'postgres'
    });

    try {
        console.log('🔌 Connecting to PostgreSQL server...');
        await superuserClient.connect();
        console.log('✅ Connected to PostgreSQL server');

        // Check if database exists
        const dbCheckResult = await superuserClient.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            [DB_NAME]
        );

        if (dbCheckResult.rows.length === 0) {
            console.log(`📦 Creating database "${DB_NAME}"...`);
            await superuserClient.query(`CREATE DATABASE ${DB_NAME}`);
            console.log(`✅ Database "${DB_NAME}" created`);
        } else {
            console.log(`✅ Database "${DB_NAME}" already exists`);
        }

        // Check if user exists
        const userCheckResult = await superuserClient.query(
            "SELECT 1 FROM pg_roles WHERE rolname = $1",
            [DB_USER]
        );

        if (userCheckResult.rows.length === 0) {
            console.log(`👤 Creating user "${DB_USER}"...`);
            await superuserClient.query(
                `CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}'`
            );
            console.log(`✅ User "${DB_USER}" created`);
        } else {
            console.log(`✅ User "${DB_USER}" already exists`);
        }

        // Grant privileges
        console.log(`🔐 Granting privileges...`);
        await superuserClient.query(
            `GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER}`
        );
        console.log(`✅ Privileges granted to "${DB_USER}"`);

        console.log('\n🎉 Database setup complete!');
        console.log(`\nConnection details:`);
        console.log(`  Host: ${DB_HOST}`);
        console.log(`  Port: ${DB_PORT}`);
        console.log(`  Database: ${DB_NAME}`);
        console.log(`  User: ${DB_USER}`);

    } catch (error) {
        console.error('❌ Error setting up database:', error.message);
        console.error('\n💡 Make sure:');
        console.error('  1. PostgreSQL is installed and running');
        console.error('  2. You have superuser credentials (postgres/postgres by default)');
        console.error('  3. Set POSTGRES_USER and POSTGRES_PASSWORD env vars if different');
        process.exit(1);
    } finally {
        await superuserClient.end();
    }
}

setupDatabase();

