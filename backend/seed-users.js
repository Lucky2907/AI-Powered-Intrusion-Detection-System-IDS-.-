const bcrypt = require('bcryptjs');
const db = require('./src/models');

async function seedUsers() {
  try {
    const existingUsers = await db.User.count();
    if (existingUsers > 0) {
      console.log(`Users already exist (${existingUsers}). Skipping seed.`);
      process.exit(0);
    }

    const users = [
      { username: 'admin', email: 'admin@ai-ids.com', password: 'admin123', fullName: 'Admin User', role: 'admin' },
      { username: 'analyst', email: 'analyst@ai-ids.com', password: 'analyst123', fullName: 'Security Analyst', role: 'analyst' },
      { username: 'viewer', email: 'viewer@ai-ids.com', password: 'viewer123', fullName: 'Viewer User', role: 'viewer' }
    ];

    for (const userData of users) {
      const { password, ...userInfo } = userData;
      await db.User.create({
        ...userInfo,
        passwordHash: await bcrypt.hash(password, 10),
        isActive: true
      });
      console.log(`✅ ${userData.username}`);
    }

    console.log('\nLogin: admin/admin123 | analyst/analyst123 | viewer/viewer123');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

seedUsers();
