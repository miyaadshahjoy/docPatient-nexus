const mongoose = require('mongoose');
const validator = require('validator');
//////////////////////////////////////////////////////////////////////////
const instanceMethodsPlugin = require('../utils/instanceMethodsPlugin');
const passwordEncryption = require('../utils/passwordEncryption');
const passwordChangedAtModify = require('../utils/passwordChangedAtModify');

// Schema definition
const adminSchema = new mongoose.Schema({
  fullname: {
    type: String,
    unique: true, // The unique Option is Not a Validator
    required: [true, 'Admin must provide a name'],
    minlength: [10, 'Name should contain atleast 10 characters'],
    maxlength: [30, 'Name should not contain more than 30 characters'],
  },
  email: {
    type: String,
    required: [true, 'Admin must provide an email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  phone: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
    minlength: [8, 'Password must contain atleast 8 characters!'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: true,
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same...🚫🚫',
    },
  },
  passwordChangedAt: Date,
  role: {
    type: String,
    required: true,
    default: 'admin',
  },
  active: {
    type: Boolean,
    default: true,
  },
  approved: {
    type: Boolean,
    default: false,
  },
  ///////////////////////////////////

  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetTokenExpire: Date,
  emailVerificationToken: String,
  emailVerificationTokenExpire: Date,
  emailVerified: {
    type: Boolean,
    default: false,
  },
});

// middlewares
adminSchema.pre('save', passwordEncryption);

// Instance methods
adminSchema.plugin(instanceMethodsPlugin);
adminSchema.pre('save', passwordChangedAtModify);

// Model Definition
const Admin = mongoose.model('Admin', adminSchema);

// Exporting Model
module.exports = Admin;
