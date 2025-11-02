#!/usr/bin/env node

/**
 * Database Migration Script
 * 
 * This script runs the database schema migrations.
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_NAME = process.env.DB_NAME
const DB_USER = process.env.DB_USER
const DB_PASSWORD = process.env.DB_PASSWORD
const DB_HOST = process.env.DB_HOST
const DB_PORT = process.env.DB_PORT

async function runMigrations() {
    const client = new Client({
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME
    });

    try {
        console.log('🔌 Connecting to database...');
        await client.connect();
        console.log('✅ Connected to database');

        // Read schema file
        const schemaPath = path.join(__dirname, '..', 'src', 'infra', 'database', 'schema.sql');
        console.log(`📄 Reading schema from: ${schemaPath}`);

        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Run migrations
        console.log('🔄 Running migrations...');
        await client.query(schema);
        console.log('✅ Migrations completed successfully');

        // Verify tables
        const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

        console.log('\n📊 Tables created:');
        tablesResult.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });

        console.log('\n🎉 Database migration complete!');

    } catch (error) {
        console.error('❌ Error running migrations:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigrations();

