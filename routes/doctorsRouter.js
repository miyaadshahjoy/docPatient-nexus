const express = require('express');
const doctorsController = require('./../controllers/doctorsController');
const authController = require('./../controllers/authController');
const userController = require('./../controllers/userController');
const appointmentsRouter = require('./../routes/appointmentsRouter');
const Doctor = require('../models/doctorsModel');
// const appointmentsController = require('../controllers/appointmentsController');
const {
  readAllDocuments,
  readDocument,
} = require('../controllers/handlerFactory');
const Appointment = require('../models/appointmentsModel');

const router = express.Router();

router.use('/:doctorId/appointments', appointmentsRouter);
//===================== Authentication Routes ==========================
router.post('/signup', authController.signupDoctor);
router.post('/signin', authController.signinDoctor);

// ===================== Password Reset Routes =============================
router.post('/forgot-password', authController.forgotPassword(Doctor));
router.post(
  '/reset-password/:resetToken',
  authController.resetPassword(Doctor)
);

// =============== Protected Routes (Requires Authentication) ==============
router.use(authController.protect);

// ===================== Route for Email verification =======================
router.get('/verify-email/:verificationToken', authController.verifyEmail);

router.use(userController.restrictToAprovedUser);

router
  .route('/doctors-within/:distance/center/:latlng/unit/:unit')
  .get(authController.restrictToPatient, doctorsController.findDoctorsWithin);
router
  .route('/distances/:latlng/unit/:unit')
  .get(authController.restrictToPatient, doctorsController.getDoctorDistances);

// =================== Doctor Account Management =========================
router
  .route('/account')
  .get(authController.restrictToDoctor, userController.getDoctorAccount)
  .patch(authController.restrictToDoctor, userController.updateDoctorAccount)
  .delete(authController.restrictToDoctor, userController.deleteDoctorAccount);
router.patch(
  '/account/password',
  authController.restrictToDoctor,
  authController.updatePassword(Doctor)
);

// ===================== Get Appointments on a Doctor ========================
router
  .route('/appointments')
  .get(authController.restrictToDoctor, (req, res, next) => {
    readAllDocuments(Appointment, { doctor: req.user.id })(req, res, next);
  });

router
  .route('/appointments/:id')
  .get(authController.restrictToDoctor, (req, res, next) => {
    readDocument(Appointment, { path: 'patient' }, { doctor: req.user.id })(
      req,
      res,
      next
    );
  });

// ============================ Admin Routes =============================
router
  .route('/')
  .get(doctorsController.getAllDoctors)
  .post(authController.restrictToAdmin, doctorsController.addDoctor);
router
  .route('/:id')
  .get(doctorsController.getDoctor)
  .patch(authController.restrictToAdmin, doctorsController.updateDoctor)
  .delete(authController.restrictToAdmin, doctorsController.removeDoctor);

module.exports = router;
