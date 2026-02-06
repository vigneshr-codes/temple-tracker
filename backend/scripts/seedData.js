const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// Import models
const User = require('../models/User');
const Donation = require('../models/Donation');
const Expense = require('../models/Expense');
const Inventory = require('../models/Inventory');
const Event = require('../models/Event');
const Fund = require('../models/Fund');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Generate random date within last 6 months
const getRandomDate = (monthsBack = 6) => {
  const start = new Date();
  start.setMonth(start.getMonth() - monthsBack);
  const end = new Date();
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Sample data
const sampleUsers = [
  {
    name: 'Temple Administrator',
    username: 'admin',
    email: 'admin@temple.com',
    password: 'admin123',
    role: 'admin'
  },
  {
    name: 'Manager Singh',
    username: 'manager',
    email: 'manager@temple.com', 
    password: 'manager123',
    role: 'manager'
  },
  {
    name: 'Volunteer Kumar',
    username: 'volunteer',
    email: 'volunteer@temple.com',
    password: 'volunteer123',
    role: 'volunteer'
  }
];

const sampleDonations = [
  // Cash donations
  {
    donor: {
      name: 'Rajesh Kumar',
      mobile: '9876543210',
      email: 'rajesh@email.com',
      address: 'Chennai, Tamil Nadu'
    },
    type: 'cash',
    amount: 5000,
    event: 'general',
    purpose: 'Temple maintenance',
    isAnonymous: false
  },
  {
    donor: {
      name: 'Priya Sharma',
      mobile: '9876543211',
      email: 'priya@email.com',
      address: 'Bangalore, Karnataka'
    },
    type: 'upi',
    amount: 2500,
    upiDetails: {
      transactionId: 'UPI123456789',
      upiId: 'priya@paytm'
    },
    event: 'guru-poojai',
    purpose: 'Guru Poojai offerings'
  },
  {
    donor: {
      name: 'Anand Iyer',
      mobile: '9876543212',
      email: 'anand@email.com',
      address: 'Mumbai, Maharashtra'
    },
    type: 'cash',
    amount: 10000,
    event: 'festival',
    purpose: 'Festival celebration'
  },
  {
    donor: {
      name: 'Lakshmi Devi',
      mobile: '9876543213',
      email: 'lakshmi@email.com',
      address: 'Hyderabad, Telangana'
    },
    type: 'upi',
    amount: 1500,
    upiDetails: {
      transactionId: 'UPI987654321',
      upiId: 'lakshmi@gpay'
    },
    event: 'anadhanam',
    purpose: 'Food for devotees'
  },
  {
    donor: {
      name: 'Vikram Reddy',
      mobile: '9876543214',
      email: 'vikram@email.com',
      address: 'Pune, Maharashtra'
    },
    type: 'cash',
    amount: 7500,
    event: 'pradosham',
    purpose: 'Pradosham puja'
  }
];

const sampleExpenses = [
  {
    category: 'cooking-gas-fuel',
    amount: 3500,
    description: 'Cooking gas cylinders for kitchen',
    vendor: {
      name: 'Bharat Gas Agency',
      contact: '9876543301',
      address: 'Main Street, City'
    },
    invoiceNumber: 'BG001',
    paymentMethod: 'cash',
    status: 'paid'
  },
  {
    category: 'labor-charges',
    amount: 8000,
    description: 'Monthly cleaning staff salary',
    vendor: {
      name: 'Cleaning Services Co.',
      contact: '9876543302',
      address: 'Service Road, City'
    },
    invoiceNumber: 'CS001',
    paymentMethod: 'bank-transfer',
    status: 'paid'
  },
  {
    category: 'electricity-bill',
    amount: 4200,
    description: 'Monthly electricity charges',
    vendor: {
      name: 'State Electricity Board',
      contact: '1912',
      address: 'Government Office'
    },
    invoiceNumber: 'EB001',
    paymentMethod: 'upi',
    status: 'paid'
  },
  {
    category: 'festival-expenses',
    amount: 15000,
    description: 'Decorations and materials for festival',
    vendor: {
      name: 'Festival Decorators',
      contact: '9876543303',
      address: 'Market Road, City'
    },
    invoiceNumber: 'FD001',
    paymentMethod: 'cash',
    status: 'approved'
  },
  {
    category: 'anadhanam-supplies',
    amount: 6500,
    description: 'Rice, vegetables and groceries for anadhanam',
    vendor: {
      name: 'Wholesale Grocery Store',
      contact: '9876543304',
      address: 'Wholesale Market, City'
    },
    invoiceNumber: 'WG001',
    paymentMethod: 'cash',
    status: 'paid'
  }
];

const sampleInventory = [
  {
    itemName: 'Rice (Ponni)',
    itemCode: 'RICE001',
    itemType: 'kitchen-supplies',
    quantity: 100,
    remainingQuantity: 75,
    unit: 'kg',
    location: 'Kitchen Store Room',
    supplier: 'Local Rice Mill',
    purchasePrice: 50,
    status: 'in-stock'
  },
  {
    itemName: 'Ghee',
    itemCode: 'GHEE001',
    itemType: 'pooja-items',
    quantity: 20,
    remainingQuantity: 12,
    unit: 'kg',
    location: 'Pooja Store',
    supplier: 'Dairy Products Co.',
    purchasePrice: 500,
    status: 'in-stock'
  },
  {
    itemName: 'Camphor',
    itemCode: 'CAMP001',
    itemType: 'pooja-items',
    quantity: 50,
    remainingQuantity: 30,
    unit: 'packets',
    location: 'Pooja Store',
    supplier: 'Religious Items Store',
    purchasePrice: 25,
    status: 'in-stock'
  },
  {
    itemName: 'Cleaning Detergent',
    itemCode: 'CLEAN001',
    itemType: 'cleaning-supplies',
    quantity: 25,
    remainingQuantity: 5,
    unit: 'bottles',
    location: 'Cleaning Store',
    supplier: 'Cleaning Supplies Co.',
    purchasePrice: 150,
    status: 'low-stock'
  }
];

const sampleEvents = [
  {
    eventName: 'Monthly Guru Poojai',
    eventType: 'recurring',
    description: 'Monthly special puja for Guru',
    startDate: new Date('2024-11-15'),
    endDate: new Date('2024-11-15'),
    location: 'Main Temple',
    organizer: 'Temple Committee',
    budget: 10000,
    status: 'scheduled'
  },
  {
    eventName: 'Pradosham Special Puja',
    eventType: 'recurring',
    description: 'Bi-monthly Pradosham puja',
    startDate: new Date('2024-11-01'),
    endDate: new Date('2024-11-01'),
    location: 'Main Temple',
    organizer: 'Temple Committee',
    budget: 5000,
    status: 'completed'
  },
  {
    eventName: 'Annual Temple Festival',
    eventType: 'special',
    description: 'Annual 3-day temple festival celebration',
    startDate: new Date('2024-12-15'),
    endDate: new Date('2024-12-17'),
    location: 'Temple Complex',
    organizer: 'Festival Committee',
    budget: 50000,
    status: 'planned'
  }
];

const sampleFunds = [
  {
    fundName: 'Temple Maintenance Fund',
    fundType: 'maintenance',
    currentBalance: 150000,
    targetAmount: 200000,
    purpose: 'Regular temple maintenance and repairs',
    isActive: true
  },
  {
    fundName: 'Festival Celebration Fund',
    fundType: 'festival',
    currentBalance: 75000,
    targetAmount: 100000,
    purpose: 'Annual and monthly festival celebrations',
    isActive: true
  },
  {
    fundName: 'Anadhanam Fund',
    fundType: 'anadhanam',
    currentBalance: 25000,
    targetAmount: 50000,
    purpose: 'Free food distribution to devotees',
    isActive: true
  }
];

const seedData = async () => {
  try {
    console.log('🌱 Starting data seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Donation.deleteMany({});
    await Expense.deleteMany({});
    await Inventory.deleteMany({});
    await Event.deleteMany({});
    await Fund.deleteMany({});

    console.log('🗑️  Cleared existing data');

    // Create users
    const users = [];
    for (const userData of sampleUsers) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
      const user = await User.create(userData);
      users.push(user);
    }
    console.log(`👥 Created ${users.length} users`);

    // Create donations with random dates
    const donations = [];
    const allDonationData = [...sampleDonations];
    
    // Create additional random donations for better chart data  
    const donorNames = ['Ram Kumar', 'Sita Devi', 'Arjun Singh', 'Meera Bai', 'Krishna Das', 'Gita Sharma', 'Mohan Das'];
    for (let i = 0; i < 20; i++) {
      const randomDonation = {
        donor: {
          name: donorNames[Math.floor(Math.random() * donorNames.length)],
          mobile: `987654${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
          email: `donor${i}@email.com`
        },
        type: ['cash', 'upi'][Math.floor(Math.random() * 2)],
        amount: Math.floor(Math.random() * 10000) + 500,
        event: ['general', 'guru-poojai', 'pradosham', 'festival', 'anadhanam'][Math.floor(Math.random() * 5)],
        purpose: 'Random donation for testing'
      };
      
      if (randomDonation.type === 'upi') {
        randomDonation.upiDetails = {
          transactionId: `UPI${Math.random().toString(36).substr(2, 9)}`,
          upiId: `donor${i}@paytm`
        };
      }
      
      allDonationData.push(randomDonation);
    }

    // Insert donations one by one with random dates to avoid ID conflicts
    for (let i = 0; i < allDonationData.length; i++) {
      const donationData = allDonationData[i];
      donationData.createdAt = getRandomDate();
      donationData.receivedBy = users[Math.floor(Math.random() * users.length)]._id;
      
      try {
        const donation = await Donation.create(donationData);
        donations.push(donation);
        
        // Small delay to ensure unique timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
      } catch (error) {
        console.log(`Skipping duplicate donation ${i + 1}: ${error.message}`);
      }
    }
    console.log(`💰 Created ${donations.length} donations`);

    // Create expenses with random dates
    const expenses = [];
    for (const expenseData of sampleExpenses) {
      expenseData.billDate = getRandomDate();
      expenseData.createdBy = users[Math.floor(Math.random() * users.length)]._id;
      const expense = await Expense.create(expenseData);
      expenses.push(expense);
    }
    
    // Create additional random expenses
    const categories = ['cooking-gas-fuel', 'labor-charges', 'electricity-bill', 'maintenance', 'festival-expenses'];
    for (let i = 0; i < 15; i++) {
      const randomExpense = {
        category: categories[Math.floor(Math.random() * categories.length)],
        amount: Math.floor(Math.random() * 5000) + 1000,
        description: `Random expense ${i + 1} for testing`,
        vendor: {
          name: `Vendor ${i + 1}`,
          contact: `987654${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
          address: `Address ${i + 1}`
        },
        invoiceNumber: `INV${String(i + 1).padStart(3, '0')}`,
        paymentMethod: ['cash', 'upi', 'bank-transfer'][Math.floor(Math.random() * 3)],
        status: ['paid', 'approved', 'pending'][Math.floor(Math.random() * 3)],
        billDate: getRandomDate(),
        createdBy: users[Math.floor(Math.random() * users.length)]._id
      };
      
      const expense = await Expense.create(randomExpense);
      expenses.push(expense);
    }
    console.log(`💸 Created ${expenses.length} expenses`);

    // Create inventory
    for (const inventoryData of sampleInventory) {
      inventoryData.createdBy = users[0]._id; // Admin user
    }
    const inventory = await Inventory.insertMany(sampleInventory);
    console.log(`📦 Created ${inventory.length} inventory items`);

    // Create events
    for (const eventData of sampleEvents) {
      eventData.createdBy = users[0]._id; // Admin user
    }
    const events = await Event.insertMany(sampleEvents);
    console.log(`📅 Created ${events.length} events`);

    // Create funds
    for (const fundData of sampleFunds) {
      fundData.createdBy = users[0]._id; // Admin user
    }
    const funds = await Fund.insertMany(sampleFunds);
    console.log(`💳 Created ${funds.length} funds`);

    console.log('✅ Data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Donations: ${donations.length}`);
    console.log(`   Expenses: ${expenses.length}`);
    console.log(`   Inventory Items: ${inventory.length}`);
    console.log(`   Events: ${events.length}`);
    console.log(`   Funds: ${funds.length}`);
    
    console.log('\n🔐 Test Login Credentials:');
    console.log('   Admin: admin / admin123');
    console.log('   Manager: manager / manager123');
    console.log('   Volunteer: volunteer / volunteer123');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run seeder
connectDB().then(() => {
  seedData();
});