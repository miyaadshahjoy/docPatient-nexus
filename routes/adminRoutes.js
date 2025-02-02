const express = require('express');
//////////////////////////////////////////////////////////////////////////
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const adminsController = require('../controllers/adminController');
const Admin = require('../models/adminsModel');
const Doctor = require('../models/doctorsModel');
const Patient = require('../models/patientsModel');

const router = express.Router();

// ========== Authentication Routes ==========
router.post('/signup', authController.signupAdmin);
router.post('/signin', authController.signinAdmin);

// ========== Password Reset Routes ==========
router.post('/forgot-password', authController.forgotPassword(Admin));
router.post('/reset-password/:resetToken', authController.resetPassword(Admin));

// ========== Protected Routes (Require Authentication) ==========
router.use(authController.protect);

// ========== Email Verification Route ==========
router.get(
  '/verify-email/:verificationToken',
  authController.restrictToAdmin,
  authController.verifyEmail
);

// ========== Admin Account Management ==========
router
  .route('/account')
  .get(authController.restrictToAdmin, userController.getAdminAccount)
  .patch(authController.restrictToAdmin, userController.updateAdminAccount)
  .delete(authController.restrictToAdmin, userController.deleteAdminAccount);

router
  .route('/account/password')
  .patch(authController.restrictToAdmin, authController.updatePassword(Admin));

// ========== Approving Doctors and Patients ==========
router.patch(
  '/approve-doctor/:id',
  authController.restrictToAdmin,
  adminsController.approveUser(Doctor)
);
router.patch(
  '/approve-patient/:id',
  authController.restrictToAdmin,
  adminsController.approveUser(Patient)
);

// ========== Super Admin Routes ==========
router.use(authController.restrictToSuperAdmin);

router.route('/').get(adminsController.getAllAdmins);

router
  .route('/:id')
  .get(adminsController.getAdmin)
  .patch(adminsController.updateAdmin)
  .delete(adminsController.deleteAdmin);

module.exports = router;
