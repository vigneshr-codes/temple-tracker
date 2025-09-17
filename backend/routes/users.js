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
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

const userValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

router.route('/')
  .get(getUsers)
  .post(userValidation, createUser);

router.route('/:id')
  .get(getUser)
  .put(userValidation, updateUser)
  .delete(deleteUser);

router.route('/:id/activate')
  .patch(activateUser);

module.exports = router;