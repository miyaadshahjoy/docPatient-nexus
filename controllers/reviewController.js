const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const Review = require('../models/reviewsModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
const Appointment = require('../models/appointmentsModel');

exports.getAllReviews = factory.readAllDocuments(Review);
exports.getReview = factory.readDocument(Review);

exports.getDoctorPatientAppointmentIds = catchAsync(async (req, res, next) => {
  req.body.doctor = req.params.doctorId;
  req.body.patient = req.user.id;
  req.body.appointment = req.params.appointId;
  // Check if the doctorId in the URL matches with the appointment
  const appointment = await Appointment.findById(req.params.appointId);
  const doctorId = new ObjectId(req.params.doctorId);
  const patientId = new ObjectId(req.user.id);

  if (!doctorId.equals(appointment.doctor))
    return next(
      new AppError('The doctor Id does not belong to this appointment', 400)
    );

  if (!patientId.equals(appointment.patient))
    return next(new AppError('The patient did not book this appointment', 400));
  next();
});
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
