#!/usr/bin/env node

/**
 * Database Cleanup Script
 * 
 * This script removes old applications to keep the database clean.
 * Can be run manually or scheduled via cron.
 * 
 * Usage:
 *   node scripts/clean-db.js [days]
 *   
 * Example:
 *   node scripts/clean-db.js 30  # Remove applications older than 30 days
 */

const { Client } = require('pg');
require('dotenv').config();

const DB_NAME = process.env.DB_NAME || 'job_application_service';
const DB_USER = process.env.DB_USER || 'job_app_user';
const DB_PASSWORD = process.env.DB_PASSWORD || 'securepassword';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;

// Get days from command line argument or default to 90
const DAYS_OLD = parseInt(process.argv[2] || '90', 10);

async function cleanOldApplications() {
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

        // Count applications to be deleted
        const countResult = await client.query(
            `SELECT COUNT(*) as count 
       FROM applications 
       WHERE created_at < NOW() - INTERVAL '${DAYS_OLD} days'`
        );

        const count = parseInt(countResult.rows[0].count, 10);

        if (count === 0) {
            console.log(`✅ No applications older than ${DAYS_OLD} days found`);
            return;
        }

        console.log(`🗑️  Found ${count} applications older than ${DAYS_OLD} days`);
        console.log('🔄 Deleting old applications...');

        // Delete old applications
        const deleteResult = await client.query(
            `DELETE FROM applications 
       WHERE created_at < NOW() - INTERVAL '${DAYS_OLD} days'`
        );

        console.log(`✅ Deleted ${deleteResult.rowCount} old applications`);

        // Show statistics
        const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total_applications,
        COUNT(DISTINCT job_id) as total_jobs
      FROM applications
    `);

        console.log('\n📊 Current database statistics:');
        console.log(`  Total applications: ${statsResult.rows[0].total_applications}`);
        console.log(`  Total jobs: ${statsResult.rows[0].total_jobs}`);

        console.log('\n🎉 Cleanup complete!');

    } catch (error) {
        console.error('❌ Error cleaning database:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

console.log(`🧹 Starting database cleanup (removing applications older than ${DAYS_OLD} days)...`);
cleanOldApplications();

