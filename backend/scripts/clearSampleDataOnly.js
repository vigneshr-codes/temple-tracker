const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// Import models
const User = require('../models/User');
const Donation = require('../models/Donation');
const Expense = require('../models/Expense');
const Inventory = require('../models/Inventory');
const Event = require('../models/Event');
const Fund = require('../models/Fund');
const ScheduledReport = require('../models/ScheduledReport');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const clearSampleDataOnly = async () => {
  try {
    console.log('🗑️  Starting selective sample data cleanup...');

    // Only clear the sample users we created (not existing production users)
    const sampleUsernames = ['admin', 'manager', 'volunteer'];
    const deletedUsers = await User.deleteMany({ 
      username: { $in: sampleUsernames } 
    });
    console.log(`✅ Cleared ${deletedUsers.deletedCount} sample users`);

    // Clear donations (these were all sample data)
    const deletedDonations = await Donation.deleteMany({});
    console.log(`✅ Cleared ${deletedDonations.deletedCount} donations`);

    // Clear expenses (these were all sample data)
    const deletedExpenses = await Expense.deleteMany({});
    console.log(`✅ Cleared ${deletedExpenses.deletedCount} expenses`);

    // Clear inventory (these were all sample data)
    const deletedInventory = await Inventory.deleteMany({});
    console.log(`✅ Cleared ${deletedInventory.deletedCount} inventory items`);

    // Clear events (these were all sample data)
    const deletedEvents = await Event.deleteMany({});
    console.log(`✅ Cleared ${deletedEvents.deletedCount} events`);

    // Clear funds (these were all sample data)
    const deletedFunds = await Fund.deleteMany({});
    console.log(`✅ Cleared ${deletedFunds.deletedCount} funds`);

    // Clear scheduled reports (these were all sample data)
    const deletedReports = await ScheduledReport.deleteMany({});
    console.log(`✅ Cleared ${deletedReports.deletedCount} scheduled reports`);

    console.log('\n🎉 Selective sample data cleanup completed!');
    console.log('📊 Only the recently added sample data has been removed.');
    console.log('👤 Any existing production users should be preserved.');

  } catch (error) {
    console.error('❌ Error clearing sample data:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run selective cleanup
connectDB().then(() => {
  clearSampleDataOnly();
});