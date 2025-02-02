const express = require('express');
const reviewsController = require('../controllers/reviewController');
const authController = require('../controllers/authController');
// const Patient = require('./../models/patientsModel');
const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(authController.restrictToAdmin, reviewsController.getAllReviews)
  .post(
    authController.restrictToPatient,
    reviewsController.getDoctorPatientAppointmentIds,
    reviewsController.createReview
  );

router
  .route('/:id')
  .get(authController.restrictToPatient, reviewsController.getReview)
  .patch(authController.restrictToPatient, reviewsController.updateReview)
  .delete(
    authController.restrictToAdminPatient,
    reviewsController.deleteReview
  );

module.exports = router;
