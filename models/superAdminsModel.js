const mongoose = require('mongoose');
const validator = require('validator');
//////////////////////////////////////////////////////////////////////////
const instanceMethodsPlugin = require('../utils/instanceMethodsPlugin');
const passwordEncryption = require('../utils/passwordEncryption');
const passwordChangedAtModify = require('../utils/passwordChangedAtModify');

// Schema definition
const superAdminSchema = new mongoose.Schema({
  fullName: {
    type: String,
    unique: true,
    required: [true, 'A super admin must provide a name'],
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
    required: [true, 'A super admin must provide an email'],
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
    minlength: [8, 'Password must contain atleast 8 characters'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: true,
    validate: {
      validator: function (value) {
        return value === this.password;
      },
      message: 'Passwords are not the same...🚫🚫',
    },
  },

  role: {
    type: String,
    required: true,
    default: 'superAdmin',
  },
  active: {
    type: Boolean,
    default: true,
  },
  approved: {
    type: Boolean,
    default: true,
  },
  ////////////////////////////////////

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

// Middlewares
superAdminSchema.pre('save', passwordEncryption);

// Instance methods
superAdminSchema.plugin(instanceMethodsPlugin);
superAdminSchema.pre('save', passwordChangedAtModify);

// Model Definition
const SuperAdmin = mongoose.model('SuperAdmin', superAdminSchema);

// Export Model
module.exports = SuperAdmin;
