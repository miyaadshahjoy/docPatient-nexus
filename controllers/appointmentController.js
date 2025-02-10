const stripe = require('stripe')(process.env.STRIPE_PUBLIC_KEY);
//////////////////////////////////////////////////////////////////////////
const Appointment = require('../models/appointmentsModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
const Doctor = require('../models/doctorsModel');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

exports.getAllAppointments = factory.readAllDocuments(Appointment);

exports.getAppointment = factory.readDocument(Appointment, [
  {
    path: 'patient',
    select: 'fullName gender address ',
  },
  {
    path: 'doctor',
    select: 'fullName experience specialization averageRating',
  },
]);
exports.getDoctorPatientIds = (req, res, next) => {
  req.body.doctor = req.params.doctorId;
  req.body.patient = req.user.id;
  next();
};

// Get available time slots for a doctor on a given day
exports.getAvailableTimeSlots = catchAsync(async (req, res, next) => {
  // Input: Doctor ID and the target date.
  let targetDate;
  if (req.body.appointmentDate) {
    targetDate = new Date(req.body.appointmentDate);
  } else {
    targetDate = new Date(req.body.date);
  }
  const currentDay = new Date();
  targetDate.setHours(0, 0, 0, 0);
  currentDay.setHours(0, 0, 0, 0);
  if (targetDate < currentDay)
    return next(new AppError('Please enter a valid date', 400));
  const doctor = await Doctor.findById(req.params.doctorId);
  if (!doctor)
    return next(new AppError('There is no Doctor for that Id😞😞', 400));
  const givenDay = targetDate.getDay();
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ];
  // Step 1: Fetch the doctor's working hours for the given day.
  //     Call the database to retrieve the doctor's availability schedule for the specified day.
  const availibilitySchedule = doctor.availibilitySchedule.find(
    (ob) => ob.day === days[givenDay]
  );
  if (!availibilitySchedule)
    return next(new AppError('Doctor is not available today😅'));
  console.log(
    `Available on: ${availibilitySchedule.day}. From: ${availibilitySchedule.time}`,
    availibilitySchedule
  );
  // Step 2: Fetch booked appointments for the given day.
  //     Query the database for appointments associated with the doctor on the specified date.

  const bookedAppointments = await Appointment.find({
    doctor: doctor._id,
    appointmentDate: {
      $gte: targetDate.setHours(0, 0, 0, 0), // start of the day
      $lt: targetDate.setHours(23, 59, 59, 999), // end of the day
    },
  });

  // Step 3: Generate all possible time slots.
  //     Calculate the time slots from the start to the end of the working hours based on the doctor’s appointment duration (e.g., 1 hour).

  const { appointmentDuration } = doctor;

  let [startingHour, finishingHour] = availibilitySchedule.time
    .split('-')
    .map((str) => Number.parseInt(str));

  finishingHour =
    finishingHour < startingHour ? finishingHour + 12 : finishingHour;
  const durationInHours = appointmentDuration / 60; // duration in hours
  const timeSlots = [];
  let s = startingHour;
  let f = startingHour + durationInHours;
  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth();
  const targetDay = targetDate.getDate();

  while (f <= finishingHour) {
    const startTime = new Date(targetYear, targetMonth, targetDay, s + 6, 0, 0);
    const finishTime = new Date(
      targetYear,
      targetMonth,
      targetDay,
      f + 6,
      0,
      0
    );

    timeSlots.push({
      startTime,
      finishTime,
    });
    s = f;
    f = f + durationInHours;
  }

  // Step 4: Filter out booked time slots.
  //     Compare each generated time slot with the list of booked appointments and remove any overlapping slots.

  const bookedDates = bookedAppointments.map((appmnt) =>
    appmnt.appointmentDate.getTime()
  );

  const availableTimeSlots = timeSlots.filter((slot) => {
    return !bookedDates.includes(slot.startTime.getTime());
  });

  // Step 5: Return the available time slots.
  //     Provide the list of slots that are free for booking.
  //
  req.availableTimeSlots = availableTimeSlots;
  next();
  /*
  res.status(200);
  res.json({
    status: 'success',
    results: availableTimeSlots.length,
    data: {
      availableTimeSlots,
    },
  });*/
});

exports.checkTimeSlot = (req, res, next) => {
  // Check if the appointmentDate is valid or not
  const appointmentDate = new Date(req.body.appointmentDate).getTime();
  // Get Available Time Slots

  const availableTimeSlots = req.availableTimeSlots.map((slot) =>
    slot.startTime.getTime()
  );

  if (!availableTimeSlots.includes(appointmentDate))
    return next(
      new AppError('This time slot is not available for booking🧾', 400)
    );
  next();
};

exports.cancelAppointment = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  // 1) Verify if the appointment ID is valid
  const appointment = await Appointment.findById(id);
  if (!appointment)
    return next(new AppError('No appointment exists with this ID...🙄😔', 400));
  // 2) Verify that the appointment  belongs to the requesting patient
  const patientId = new ObjectId(req.user.id);
  if (!patientId.equals(appointment.patient))
    return next(
      new AppError(
        'You do not have the permission to cancel this appointment..😒❌',
        403
      )
    );
  // 3) Check if the appointment is eligible for cancellation

  // The appoinment must be cancelled at least 24 hours before the scheduled time
  const timestamp24Hrs = 24 * 60 * 60 * 1000;
  console.log(Date.now(), appointment.appointmentDate.getTime());
  if (appointment.appointmentDate.getTime() - Date.now() < timestamp24Hrs)
    return next(
      new AppError(
        'You are not eligible to cancel this appointement. You must cancel an appointment at least 24 hours before the scheduled time⏲❌',
        400
      )
    );

  // Check if the appointment is already cancelled or past date
  if (appointment.appointmentDate < Date.now())
    return next(new AppError('You can not delete a past appointment.', 400));

  if (appointment.status === 'cancelled')
    return next(new AppError('The appointment is already cancelled.', 400));

  // 4) Update records in the Database
  appointment.status = 'cancelled';
  appointment.refund = 'processing';
  appointment.save();
  // 5) Send a response to the patient
  res.status(200);
  res.json({
    status: 'success',
    message: 'You have successfully cancelled the appointment.',
    refundDetails: {
      amount: appointment.paymentAmount,
      status: 'processing',
      expectedCompletion: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    },
  });
});
exports.upcomingAppointments = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  let appointments;
  if (req.user.role === 'doctor') {
    appointments = await Appointment.find({
      doctor: userId,
      appointmentDate: { $gt: Date.now() },
      status: { $ne: 'cancelled' },
    });
  } else if (req.user.role === 'patient') {
    appointments = await Appointment.find({
      patient: userId,
      appointmentDate: { $gt: Date.now() },
      status: { $ne: 'cancelled' },
    });
  }
  if (!appointments)
    return next(new AppError('You have no upcoming appointments', 404));
  res.status(200);
  res.json({
    status: 'success',
    resutls: appointments.length,
    data: {
      appointments,
    },
  });
});

// TODO: Create Stripe Checkout Session on the back-end
exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the Doctor on whom the Appointment is booked
  const { doctorId } = req.params;
  const { appointmentId } = req.cookies;

  const doctor = await Doctor.findById(doctorId);
  // 2) Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get(
      'host'
    )}/?appointmentId=${appointmentId}`,
    // cancel_url: `${req.protocol}://${req.get('host')}/`,
    customer_email: req.user.email,
    client_reference_id: doctorId,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: 99 * 100,
          product_data: {
            name: `${doctor.fullName}'s Appointment`,
            images: [
              'https://images.unsplash.com/photo-1638202993928-7267aad84c31?q=80&w=1587&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            ],
          },
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
  });

  // 3) Send checkout session as response
  res.status(200);
  res.json({
    status: 'success',
    session,
  });
});

exports.updatePaymentStatus = catchAsync(async (req, res, next) => {
  const { appointmentId } = req.query;
  if (!appointmentId) return next();
  const appointment = await Appointment.findByIdAndUpdate(
    appointmentId,
    { paymentStatus: 'paid' },
    {
      new: true,
      runValidators: true,
    }
  );
  /*
  res.status(200);
  res.json({
    status: 'success',
    appointment,
  });
  */
  res.redirect(req.originalUrl.split('?')[0]);
});

exports.bookAppointment = catchAsync(async (req, res, next) => {
  const newAppointment = await Appointment.create(req.body);
  const cookieOptions = {
    expires: new Date(Date.now() + 10 * 60 * 1000),
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('appointmentId', newAppointment.id, cookieOptions);
  res.status(201);
  res.json({
    status: 'success',
    data: {
      newAppointment,
    },
  });
});
exports.updateAppointment = factory.updateOne(Appointment);
exports.deleteAppointment = factory.deleteOne(Appointment);
