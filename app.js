// Core Modules
const path = require('path');
//////////////////////////////////////////////////////////////////////////

// Third-Party Modules
const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
///////////////////////////////////////////////////////////////////////////

// Local Modules (User defined modules)
const viewRouter = require('./routes/viewRoutes');
const superAdminRouter = require('./routes/superAdminRoutes');
const adminsRouter = require('./routes/adminRoutes');
const doctorsRouter = require('./routes/doctorRoutes');
const patientsRouter = require('./routes/patientRoutes');
const appointmentRouter = require('./routes/appointmentRoutes');
const reviewsRouter = require('./routes/reviewRoutes');
const prescriptionsRouter = require('./routes/prescriptionRoutes');
// const medicalRecordsRouter = require('./routes/medicalRecordRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

//////////////////////////////////////////////////////////////////////////
// Express App
const app = express();

//////////////////////////////////////////////////////////////////////////
// Global middlewares

// Template Engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Serving Static files
app.use(express.static(path.join(__dirname, 'public')));

// Setting up security Http headers
app.use(helmet());

// Body parser, reading data from body into req.body
app.use(express.json());

// Cookie parser, extract data stored in a cookie
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'reviewsCount',
      'bloodGroup',
      'averageRating',
      'experience',
      'specialization',
    ],
  })
);

// routes
app.use('/', viewRouter);
app.use('/api/v1/super-admins', superAdminRouter);
app.use('/api/v1/admins', adminsRouter);
app.use('/api/v1/doctors', doctorsRouter);
app.use('/api/v1/patients', patientsRouter);
app.use('/api/v1/appointments', appointmentRouter);
app.use('/api/v1/reviews', reviewsRouter);
app.use('/api/v1/prescriptions', prescriptionsRouter);
// app.use('/api/v1/medical-records', medicalRecordsRouter);
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this SERVER!`, 404));
});

// Global Error Handling Middleware
app.use(globalErrorHandler);

module.exports = app;
