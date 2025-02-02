const express = require('express');
const viewController = require('../controllers/viewController');
const appointmenController = require('../controllers/appointmentController');

const router = express.Router();

router
  .route('/')
  .get(appointmenController.updatePaymentStatus, viewController.getHomepage);

module.exports = router;
