// MongoDB initialization script
db = db.getSiblingDB('templetracker');

// Create collections
db.createCollection('users');
db.createCollection('donations');
db.createCollection('inventoryitems');
db.createCollection('expenses');
db.createCollection('events');
db.createCollection('funds');
db.createCollection('settings');
db.createCollection('notificationlogs');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.donations.createIndex({ "donationId": 1 }, { unique: true });
db.donations.createIndex({ "createdAt": -1 });
db.expenses.createIndex({ "expenseId": 1 }, { unique: true });
db.expenses.createIndex({ "status": 1 });
db.inventoryitems.createIndex({ "itemId": 1 }, { unique: true });
db.events.createIndex({ "eventId": 1 }, { unique: true });
db.notificationlogs.createIndex({ "createdAt": -1 });
db.notificationlogs.createIndex({ "trigger": 1, "status": 1 });

// Create default admin user with pre-hashed password
// Password hash for 'admin123' using bcrypt with salt rounds 10
const hashedPassword = '$2b$10$0i1iPZVlhZX0vsgJp.x4VuQjWFqhfyX0SccjxxsnYOIg7QXZ81ksa';

const adminUser = {
  username: 'admin',
  name: 'System Administrator',
  email: 'admin@gmail.com',
  password: hashedPassword,
  role: 'admin',
  isActive: true,
  permissions: {
    donations: { create: true, read: true, update: true, delete: true },
    inventory: { create: true, read: true, update: true, delete: true },
    expenses: { create: true, read: true, update: true, delete: true, approve: true },
    funds: { create: true, read: true, update: true, delete: true, allocate: true },
    events: { create: true, read: true, update: true, delete: true },
    users: { create: true, read: true, update: true, delete: true },
    reports: { read: true, export: true, create: true }
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

// Insert admin user if not exists
const existingAdmin = db.users.findOne({
  $or: [
    { email: 'admin@gmail.com' },
    { username: 'admin' }
  ]
});

if (!existingAdmin) {
  const result = db.users.insertOne(adminUser);
  if (result.acknowledged) {
    print('✅ Default admin user created successfully!');
    print('📧 Email: admin@gmail.com');
    print('👤 Username: admin');
    print('🔐 Password: admin123');
  } else {
    print('❌ Failed to create admin user');
  }
} else {
  print('ℹ️ Admin user already exists');
}

print('✅ Database initialized successfully!');
