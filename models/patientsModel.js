const mongoose = require('mongoose');
const validator = require('validator');
//////////////////////////////////////////////////////////////////////////
const instanceMethodsPlugin = require('../utils/instanceMethodsPlugin');
const passwordEncryption = require('../utils/passwordEncryption');
const passwordChangedAtModify = require('../utils/passwordChangedAtModify');

// Schema definition
const patientSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      unique: true, // The unique Option is Not a Validator
      required: [true, 'A patient must provide a name'],
      minlength: [10, 'Name should contain atleast 10 characters'],
      maxlength: [30, 'Name should not contain more than 30 characters'],
    },
    email: {
      type: String,
      unique: true,
      required: [true, 'A patient must provide an email'],
      validate: [validator.isEmail, 'Provide a valid email'],
    },
    phone: {
      type: String,
      unique: true,
      required: [true, 'A patient must provide a phone number'],
    },

    doctors: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Doctor',
        required: true,
      },
    ],

    profilePicture: String,
    gender: {
      type: String,
      required: [true, 'A patient must provide the gender'],
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'A patient must provide the date of birth'],
    },
    bloodGroup: {
      type: String,
      required: [true, 'A patient must provide the blood group'],
    },
    allergies: [String],
    chronicConditions: [String],
    currentMedications: [String],
    familyHistory: [String],
    emergencyContact: {
      name: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      relationship: {
        type: String,
        required: true,
      },
    },
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
    },
    appointmentHistory: [
      {
        doctorId: String,
        date: Date,
        reason: String,
        prescription: String,
      },
    ],
    lastVisitDate: {
      type: Date,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: [8, 'Password must contain atleast 8 characters.'],
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: true,
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: 'Passwords are not same...🚫🚫',
      },
    },
    role: {
      type: String,
      default: 'patient',
    },
    active: {
      type: Boolean,
      default: true,
    },
    approved: {
      type: Boolean,
      default: false,
    },
    ///////////////////////////
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetTokenExpire: Date,

    emailVerificationToken: String,
    emailVerificationTokenExpire: Date,
    emailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
// exports.patientSchema = patientSchema;

// middlewares

// virtual populate
patientSchema.virtual('appointments', {
  ref: 'Appointment',
  foreignField: 'patient',
  localField: '_id',
});
patientSchema.pre('save', passwordEncryption);
patientSchema.pre('save', passwordChangedAtModify);

// Instance methods
patientSchema.plugin(instanceMethodsPlugin);

// Model Definition
const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;
