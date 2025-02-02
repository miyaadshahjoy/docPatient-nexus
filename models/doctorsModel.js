const mongoose = require('mongoose');
const validator = require('validator');
const instanceMethodsPlugin = require('../utils/instanceMethodsPlugin');
const passwordEncryption = require('./../utils/passwordEncryption');
const passwordChangedAtModify = require('../utils/passwordChangedAtModify');

const doctorSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      unique: true, // The unique Option is Not a Validator
      required: [true, 'A doctor must provide a name'],
      minlength: [10, 'Name should contain atleast 10 characters'],
      maxlength: [30, 'Name should not contain more than 30 characters'],
    },
    email: {
      type: String,
      unique: true,
      required: [true, 'A doctor must provide an email'],
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      unique: true,
      required: [true, 'A doctor must provide a phone number'],
    },

    profilePicture: {
      type: String,
    },
    specialization: {
      type: [String],
      required: [true, 'A doctor must provide specialization'],
    },
    qualification: {
      type: [String],
      required: [true, 'A doctor must provide a qualification'],
    },
    experience: {
      type: Number, // Experience in years
      required: [true, 'A doctor must provide experience '],
    },
    licenseNumber: {
      type: String,
    },
    clinicName: {
      type: String,
    },
    workAddress: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    availibilitySchedule: {
      type: [Object],
    },
    appointmentDuration: {
      type: Number,
    },
    appointmentFees: {
      type: Number,
      required: [true, 'Please provide the doctors appointment fees!'],
    },
    averageRating: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be at least 1 or greater'],
      max: [5, 'Rating must not be more than 5'],
    },
    reviewsCount: {
      type: Number,
      default: 0,
    },
    availibility: Boolean,

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must contain atleast 8 characters'],
      select: false, // FIXME: password is still showing
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Password confirm is required'],
      validate: {
        // This only works on CREATE and SAVE
        validator: function (el) {
          return el === this.password;
        },
        message: 'Passwords are not the same🚫🚫',
      },
    },
    role: {
      type: String,
      default: 'doctor',
    },
    active: {
      type: Boolean,
      default: true,
    },
    approved: {
      type: Boolean,
      default: false,
    },
    //////////////////////////
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

// Indexes

doctorSchema.index({ experience: 1 });
doctorSchema.index({ averageRating: 1 });
doctorSchema.index({ workAddress: '2dsphere' });

// middlewares

// virtual populate
doctorSchema.virtual('patients', {
  ref: 'Patient',
  foreignField: 'doctors',
  localField: '_id',
});
doctorSchema.virtual('appointments', {
  ref: 'Appointment',
  foreignField: 'doctor',
  localField: '_id',
});

doctorSchema.pre('save', passwordEncryption);

// Instance methods
doctorSchema.plugin(instanceMethodsPlugin);
doctorSchema.pre('save', passwordChangedAtModify);

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor;
