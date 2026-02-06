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

const clearSampleData = async () => {
  try {
    console.log('🗑️  Starting data cleanup...');

    // Clear all sample data
    await User.deleteMany({});
    console.log('✅ Cleared users');

    await Donation.deleteMany({});
    console.log('✅ Cleared donations');

    await Expense.deleteMany({});
    console.log('✅ Cleared expenses');

    await Inventory.deleteMany({});
    console.log('✅ Cleared inventory');

    await Event.deleteMany({});
    console.log('✅ Cleared events');

    await Fund.deleteMany({});
    console.log('✅ Cleared funds');

    await ScheduledReport.deleteMany({});
    console.log('✅ Cleared scheduled reports');

    console.log('\n🎉 Database cleanup completed successfully!');
    console.log('📊 All sample data has been removed from the database.');

  } catch (error) {
    console.error('❌ Error clearing data:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run cleanup
connectDB().then(() => {
  clearSampleData();
});