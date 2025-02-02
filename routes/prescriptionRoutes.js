const express = require('express');
const authController = require('../controllers/authController');
const prescriptionsController = require('../controllers/prescriptionController');

const router = express.Router();

// ----------------------------- Protect Routes ------------------------------

router.use(authController.protect);

// -------------------------- Creating Prescription --------------------------
router
  .route('/')
  .post(
    authController.restrictToDoctor,
    prescriptionsController.createPrescription
  )
  .get(prescriptionsController.getAllPrescriptions);

module.exports = router;
