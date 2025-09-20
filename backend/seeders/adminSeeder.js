const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/database');

const createAdminUser = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('🌱 Starting admin user seeding...');

    // Force delete any existing admin users to ensure clean state
    const deleteResult = await User.deleteMany({ 
      $or: [
        { email: 'admin@gmail.com' },
        { username: 'admin' }
      ]
    });
    
    if (deleteResult.deletedCount > 0) {
      console.log('🗑️ Deleted', deleteResult.deletedCount, 'existing admin user(s)');
    }

    console.log('📝 Creating fresh admin user...');

    // Create admin user
    const adminUser = new User({
      username: 'admin',
      name: 'System Administrator',
      email: 'admin@gmail.com',
      password: 'admin123',
      role: 'admin',
      isActive: true
    });

    const savedAdmin = await adminUser.save();
    console.log('🎉 Admin user created successfully!');
    console.log('📧 Email:', savedAdmin.email);
    console.log('👤 Username:', savedAdmin.username);
    console.log('🔐 Password: admin123');
    console.log('🔑 Role:', savedAdmin.role);

    return savedAdmin;
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    throw error;
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    }
  }
};

// Run seeder if called directly
if (require.main === module) {
  createAdminUser()
    .then(() => {
      console.log('🌱 Admin seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Admin seeding failed:', error);
      process.exit(1);
    });
}

module.exports = createAdminUser;