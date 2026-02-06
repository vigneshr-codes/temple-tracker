/**
 * Script to update all existing users' permissions based on their roles
 * Run with: node scripts/updateUserPermissions.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Import User model
const User = require('../models/User');

const updateUserPermissions = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users to update`);

    let updated = 0;
    for (const user of users) {
      // Set permissions based on role
      user.setRolePermissions();
      await user.save();
      console.log(`Updated permissions for ${user.username} (${user.role})`);
      updated++;
    }

    console.log(`\nSuccessfully updated ${updated} users`);
    process.exit(0);
  } catch (error) {
    console.error('Error updating permissions:', error);
    process.exit(1);
  }
};

updateUserPermissions();
