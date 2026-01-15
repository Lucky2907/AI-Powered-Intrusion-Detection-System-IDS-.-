/**
 * PostgreSQL Database Setup Script
 * Creates database and initializes tables
 */

require('dotenv').config();
const { Client } = require('pg');
const db = require('./src/models');
const bcrypt = require('bcryptjs');

async function setupDatabase() {
  // Connect to PostgreSQL server (without database)
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres' // Connect to default postgres database
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL server');

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'ai_ids_database';
    
    // Check if database exists
    const checkDb = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (checkDb.rows.length === 0) {
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database '${dbName}' created`);
    } else {
      console.log(`ℹ️  Database '${dbName}' already exists`);
    }

    await client.end();

    // Now connect with Sequelize and sync models
    console.log('\n🔄 Syncing database models...');
    await db.sequelize.authenticate();
    console.log('✅ Connected to database');

    // Sync all models (creates tables)
    await db.sequelize.sync({ force: false }); // Set to true to reset tables
    console.log('✅ All models synced');

    // Create default users
    console.log('\n👤 Creating default users...');
    
    const users = [
      {
        username: 'admin',
        email: 'admin@ids.local',
        passwordHash: await bcrypt.hash('admin123', 10),
        role: 'admin',
        fullName: 'System Administrator'
      },
      {
        username: 'analyst',
        email: 'analyst@ids.local',
        passwordHash: await bcrypt.hash('analyst123', 10),
        role: 'analyst',
        fullName: 'Security Analyst'
      },
      {
        username: 'viewer',
        email: 'viewer@ids.local',
        passwordHash: await bcrypt.hash('viewer123', 10),
        role: 'viewer',
        fullName: 'System Viewer'
      }
    ];

    for (const userData of users) {
      const [user, created] = await db.User.findOrCreate({
        where: { username: userData.username },
        defaults: userData
      });

      if (created) {
        console.log(`  ✅ Created user: ${userData.username} (${userData.role})`);
      } else {
        console.log(`  ℹ️  User already exists: ${userData.username}`);
      }
    }

    console.log('\n✨ Database setup complete!');
    console.log('\n📝 Login Credentials:');
    console.log('  Admin:   admin / admin123');
    console.log('  Analyst: analyst / analyst123');
    console.log('  Viewer:  viewer / viewer123');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('  1. Make sure PostgreSQL is running');
    console.error('  2. Check your .env file has correct DB credentials');
    console.error('  3. Ensure user has permission to create databases');
    console.error('  4. In pgAdmin, verify connection to localhost:5432');
    process.exit(1);
  }
}

setupDatabase();
