const express = require('express');
const medicalRecordController = require('../controllers/medicalRecordController');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const upload = require('../utils/configureMulter');

const router = express.Router();
router.use(authController.protect);

router
  .route('/upload')
  .patch(
    authController.restrictToAdminPatient,
    upload.array('medicalRecords', 11),
    medicalRecordController.uploadRecord,
    userController.updatePatientAccount
  );

module.exports = router;
