const express = require('express');
const reviewsRouter = require('./reviewRoutes');
const authController = require('../controllers/authController');
const appointmentController = require('../controllers/appointmentController');

const router = express.Router({ mergeParams: true });

router.use('/:appointId/reviews', reviewsRouter);

router.use(authController.protect);

router
  .route('/upcoming')
  .get(
    authController.restrictToDoctorPatient,
    appointmentController.upcomingAppointments
  );

router
  .route('/')
  .post(
    authController.restrictToPatient,
    appointmentController.getDoctorPatientIds,
    appointmentController.getAvailableTimeSlots,
    appointmentController.checkTimeSlot,
    appointmentController.bookAppointment
  )
  .get(
    authController.restrictToAdmin,
    appointmentController.getAllAppointments
  );

router
  .route('/time-slots')
  .post(
    authController.restrictToPatient,
    appointmentController.getAvailableTimeSlots,
    (req, res, next) => {
      res.status(200);
      res.json({
        status: 'success',
        results: req.availableTimeSlots.length,
        data: {
          availableTimeSlots: req.availableTimeSlots,
        },
      });
    }
  );
router
  .route('/:id')
  .get(authController.restrictToAdmin, appointmentController.getAppointment)
  .patch(
    authController.restrictToAdmin,
    appointmentController.updateAppointment
  )
  .delete(
    authController.restrictToAdmin,
    appointmentController.deleteAppointment
  );

router
  .route('/cancel/:id')
  .post(
    authController.restrictToPatient,
    appointmentController.cancelAppointment
  );

router.get(
  '/checkout-session/:doctorId',
  appointmentController.getCheckoutSession
);
module.exports = router;
