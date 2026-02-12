const { validationResult } = require('express-validator');
const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only)
const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

    const users = await User.find(filter)
      .select('-password')
      .populate('createdBy', 'name username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        current: page,
        pages: Math.ceil(totalCount / limit),
        total: totalCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin only)
const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('createdBy', 'name username email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create user
// @route   POST /api/users
// @access  Private (Admin only)
const createUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, username, email, password, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    const userData = {
      name,
      username,
      email,
      password,
      role: role || 'volunteer',
      createdBy: req.user._id
    };

    const user = await User.create(userData);

    // Return user without password
    const userResponse = await User.findById(user._id)
      .select('-password')
      .populate('createdBy', 'name username');

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin only)
const updateUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow admin to demote themselves
    if (user._id.toString() === req.user._id.toString() && req.body.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own admin role'
      });
    }

    // Check for duplicate email/username (excluding current user)
    if (req.body.email || req.body.username) {
      const existingUser = await User.findOne({
        _id: { $ne: req.params.id },
        $or: [
          { email: req.body.email },
          { username: req.body.username }
        ]
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email or username already exists'
        });
      }
    }

    // Only allow safe profile fields; role/permissions changes require admin-only endpoint
    const { name, email, phone } = req.body;
    const updateData = { name, email, phone };
    Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);

    // Allow admins to also update role and permissions
    if (req.user.role === 'admin') {
      if (req.body.role !== undefined) updateData.role = req.body.role;
      if (req.body.permissions !== undefined) updateData.permissions = req.body.permissions;
      if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;
      if (req.body.password) updateData.password = req.body.password;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .select('-password')
    .populate('createdBy', 'name username');

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow admin to delete themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    // Instead of hard delete, deactivate the user
    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Activate user
// @route   PATCH /api/users/:id/activate
// @access  Private (Admin only)
const activateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Activate the user
    user.isActive = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User activated successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  activateUser
};