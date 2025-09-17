const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/temple-tracker', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Update all users with proper permissions based on their role
const updateUserPermissions = async () => {
  try {
    console.log('Starting user permission update...');
    
    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users to update`);
    
    for (const user of users) {
      console.log(`Updating permissions for user: ${user.name} (${user.role})`);
      
      // Set permissions based on role
      user.setRolePermissions();
      
      // Save the user (this will trigger the setRolePermissions method)
      await user.save();
      
      console.log(`✅ Updated permissions for ${user.name}`);
    }
    
    console.log('✅ All users updated successfully!');
    
  } catch (error) {
    console.error('Error updating user permissions:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the update
const main = async () => {
  await connectDB();
  await updateUserPermissions();
};

main().catch(console.error);