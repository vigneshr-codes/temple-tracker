const express = require('express');
const { body } = require('express-validator');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  activateUser
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');

const router = express.Router();

router.use(protect);

const userValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

router.route('/')
  .get(checkPermission('users', 'read'), getUsers)
  .post(checkPermission('users', 'create'), userValidation, createUser);

router.route('/:id')
  .get(checkPermission('users', 'read'), getUser)
  .put(checkPermission('users', 'update'), userValidation, updateUser)
  .delete(checkPermission('users', 'delete'), deleteUser);

router.route('/:id/activate')
  .patch(checkPermission('users', 'update'), activateUser);

module.exports = router;