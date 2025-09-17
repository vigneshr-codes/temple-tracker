const express = require('express');
const { body } = require('express-validator');
const {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  getEventDonations,
  getEventExpenses
} = require('../controllers/eventController');
const { protect, authorize, checkPermission } = require('../middleware/auth');

const router = express.Router();

// Validation rules for event creation
const eventValidation = [
  body('name').notEmpty().withMessage('Event name is required'),
  body('type').notEmpty().withMessage('Event type is required'),
  body('date').isISO8601().withMessage('Please provide a valid event date'),
];

router.use(protect);

router.route('/')
  .get(checkPermission('events', 'read'), getEvents)
  .post(checkPermission('events', 'create'), eventValidation, createEvent);

router.route('/:id')
  .get(checkPermission('events', 'read'), getEvent)
  .put(checkPermission('events', 'update'), updateEvent)
  .delete(checkPermission('events', 'delete'), deleteEvent);

router.route('/:id/donations')
  .get(checkPermission('events', 'read'), getEventDonations);

router.route('/:id/expenses')
  .get(checkPermission('events', 'read'), getEventExpenses);

module.exports = router;