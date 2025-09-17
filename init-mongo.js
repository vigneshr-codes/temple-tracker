// MongoDB initialization script
db = db.getSiblingDB('templetracker');

// Create collections
db.createCollection('users');
db.createCollection('donations');
db.createCollection('inventory');
db.createCollection('expenses');
db.createCollection('events');
db.createCollection('funds');
db.createCollection('settings');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.donations.createIndex({ "donationId": 1 }, { unique: true });
db.donations.createIndex({ "createdAt": -1 });
db.expenses.createIndex({ "expenseId": 1 }, { unique: true });
db.expenses.createIndex({ "status": 1 });
db.inventory.createIndex({ "itemId": 1 }, { unique: true });
db.events.createIndex({ "eventId": 1 }, { unique: true });

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
    donations: ['create', 'read', 'update', 'delete'],
    inventory: ['create', 'read', 'update', 'delete'],
    expenses: ['create', 'read', 'update', 'delete', 'approve'],
    events: ['create', 'read', 'update', 'delete'],
    funds: ['create', 'read', 'update', 'delete'],
    users: ['create', 'read', 'update', 'delete'],
    reports: ['read', 'export'],
    settings: ['read', 'update']
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

print('Database initialized successfully!');