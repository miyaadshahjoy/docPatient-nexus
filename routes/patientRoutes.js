const express = require('express');
const patientsController = require('../controllers/patientController');
const Patient = require('../models/patientsModel');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const Appointment = require('../models/appointmentsModel');
const medicalRecordsRouter = require('./medicalRecordRoutes');

const {
  readAllDocuments,
  readDocument,
} = require('../controllers/handlerFactory');
const Prescription = require('../models/prescriptionsModel');
// Router
const router = express.Router();

router.use('/medical-records', medicalRecordsRouter);

//===================== Authentication Routes ==========================
router.post('/signup', authController.signupPatient);
router.post('/signin', authController.signinPatient);

// ===================== Password Reset Routes =============================
router.post('/forgot-password', authController.forgotPassword(Patient));
router.patch(
  '/reset-password/:resetToken',
  authController.resetPassword(Patient)
);

// =============== Protected Routes (Requires Authentication) ==============
router.use(authController.protect);

// ===================== Route for Email verification =======================
router.get('/verify-email/:verificationToken', authController.verifyEmail);

router.use(userController.restrictToAprovedUser);

// =================== Patient Account Management =========================

router
  .route('/account')
  .get(authController.restrictToPatient, userController.getPatientAccount)
  .patch(authController.restrictToPatient, userController.updatePatientAccount)
  .delete(
    authController.restrictToPatient,
    userController.deletePatientAccount
  );
router
  .route('/account/password')
  .patch(
    authController.restrictToPatient,
    authController.updatePassword(Patient)
  );

// ==================== Get Appointments on a Doctor =======================
router
  .route('/appointments')
  .get(authController.restrictToPatient, (req, res, next) => {
    readAllDocuments(Appointment, { patient: req.user.id })(req, res, next);
  });

router
  .route('/appointments/:id')
  .get(authController.restrictToPatient, (req, res, next) => {
    readDocument(
      Appointment,
      {
        path: 'doctor',
        select:
          'fullName phone experience specialization qualification workAddress averageRating',
      },
      { patient: req.user.id }
    )(req, res, next);
  });

router
  .route('/prescriptions')
  .get(authController.restrictToPatient, (req, res, next) => {
    readAllDocuments(Prescription, {
      patient: req.user.id,
    })(req, res, next);
  });

// ============================ Admin Routes =============================

router
  .route('/')
  .get(patientsController.getAllPatients)
  .post(authController.restrictToAdmin, patientsController.addPatient);
router
  .route('/:id')
  .get(patientsController.getPatient)
  .patch(authController.restrictToAdmin, patientsController.updatePatient)
  .delete(authController.restrictToAdmin, patientsController.removePatient);
module.exports = router;
