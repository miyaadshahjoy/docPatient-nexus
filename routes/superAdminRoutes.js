const express = require('express');
//////////////////////////////////////////////////////////////////////////
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const superAdminsController = require('../controllers/superAdminController');
const SuperAdmin = require('../models/superAdminsModel');
const Admin = require('../models/adminsModel');

//////////////////////////////////////////////////////////////////////////
const router = express.Router();

// Super-Admin Routes for SIGNIN and SIGNUP
router.post('/signup', authController.signupSuperAdmin);
router.post('/signin', authController.signinSuperAdmin);

// Routes for forgot password and reset password
router.post('/forgot-password', authController.forgotPassword(SuperAdmin));
router.post(
  '/reset-password/:resetToken',
  authController.resetPassword(SuperAdmin)
);

// Protect and restrict routes to Super Admin only
router.use(authController.protect, authController.restrictToSuperAdmin);

// Routes for verifying email
router.get('/verify-email/:verificationToken', authController.verifyEmail);

// Super Admin account routes
router
  .route('/account')
  .get(userController.getSuperAdminAccount)
  .patch(userController.updateSuperAdminAccount)
  .delete(userController.deleteSuperAdminAccount);
router
  .route('/account/password')
  .patch(authController.updatePassword(SuperAdmin));

// Routes for approving Admins
router.patch('/approve-admin/:id', superAdminsController.approveUser(Admin));

// Exporting Router
module.exports = router;
