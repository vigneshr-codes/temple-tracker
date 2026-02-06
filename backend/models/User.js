const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
  },
  username: {
    type: String,
    required: [true, 'Please add a username'],
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'volunteer', 'viewer'],
    default: 'volunteer',
  },
  permissions: {
    donations: {
      create: { type: Boolean, default: false },
      read: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    inventory: {
      create: { type: Boolean, default: false },
      read: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    expenses: {
      create: { type: Boolean, default: false },
      read: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    funds: {
      create: { type: Boolean, default: false },
      read: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      allocate: { type: Boolean, default: false }
    },
    events: {
      create: { type: Boolean, default: false },
      read: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    users: {
      create: { type: Boolean, default: false },
      read: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    reports: {
      read: { type: Boolean, default: false },
      export: { type: Boolean, default: false }
    }
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  }
}, {
  timestamps: true,
});

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Set permissions based on role
userSchema.methods.setRolePermissions = function() {
  const rolePermissions = {
    admin: {
      donations: { create: true, read: true, update: true, delete: true },
      inventory: { create: true, read: true, update: true, delete: true },
      expenses: { create: true, read: true, update: true, delete: true },
      funds: { create: true, read: true, update: true, delete: true, allocate: true },
      events: { create: true, read: true, update: true, delete: true },
      users: { create: true, read: true, update: true, delete: true },
      reports: { read: true, export: true }
    },
    manager: {
      donations: { create: true, read: true, update: true, delete: false },
      inventory: { create: true, read: true, update: true, delete: false },
      expenses: { create: true, read: true, update: true, delete: false },
      funds: { create: false, read: true, update: false, delete: false, allocate: false },
      events: { create: true, read: true, update: true, delete: false },
      users: { create: false, read: true, update: false, delete: false },
      reports: { read: true, export: true }
    },
    volunteer: {
      donations: { create: true, read: true, update: false, delete: false },
      inventory: { create: true, read: true, update: true, delete: false },
      expenses: { create: true, read: true, update: false, delete: false },
      funds: { create: false, read: true, update: false, delete: false, allocate: false },
      events: { create: false, read: true, update: false, delete: false },
      users: { create: false, read: false, update: false, delete: false },
      reports: { read: true, export: false }
    },
    viewer: {
      donations: { create: false, read: true, update: false, delete: false },
      inventory: { create: false, read: true, update: false, delete: false },
      expenses: { create: false, read: true, update: false, delete: false },
      funds: { create: false, read: true, update: false, delete: false, allocate: false },
      events: { create: false, read: true, update: false, delete: false },
      users: { create: false, read: false, update: false, delete: false },
      reports: { read: true, export: false }
    }
  };

  this.permissions = rolePermissions[this.role] || rolePermissions.viewer;
};

// Set permissions before saving
userSchema.pre('save', function(next) {
  // Set permissions if role is modified or if permissions are not set
  const hasNoPermissions = !this.permissions ||
    !this.permissions.donations ||
    Object.keys(this.permissions.donations).every(key => this.permissions.donations[key] === false);

  if (this.isModified('role') || this.isNew || hasNoPermissions) {
    this.setRolePermissions();
  }
  next();
});

module.exports = mongoose.model('User', userSchema);