const jwt = require('jsonwebtoken');
const Admin = require('./../models/adminsModel');
const Doctor = require('./../models/doctorsModel');
const Patient = require('./../models/patientsModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const SuperAdmin = require('../models/superAdminsModel');

// Impl: sign token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Impl: Send JWT token
const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode);
  res.json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};
// Impl: Filter Object
const filterObject = function (obj, notAllowedFields) {
  const filteredObject = {};
  Object.keys(obj).forEach((el) => {
    if (!notAllowedFields.includes(el)) {
      filteredObject[el] = obj[el];
    }
  });
  return filteredObject;
};

// Impl: Update current user account
const updateUserAccount = function (Model) {
  return catchAsync(async (req, res, next) => {
    // TODO: 1) Create error if user POSTs password data
    if (req.body.password)
      return next(
        new AppError(
          'You can not update your password from this route. You can use the /update-password route',
          400
        )
      );
    // TODO: 2) Filter out unwanted fields names that are not allowed to be updated
    const notAllowedFields = [
      'email', // FIXME: make email updateable
      'role',
      'averageRating',
      'emailVerified',
      'approved',
    ];
    const filteredObject = filterObject(req.body, notAllowedFields);

    // TODO: 3) Update user document

    const updatedUser = await Model.findOneAndUpdate(
      { _id: req.user.id },
      filteredObject,
      {
        new: true,
        runValidators: true,
      }
    );

    sendToken(updatedUser, 200, res);
  });
};

// Impl: Delete current user account

const deleteUserAccount = function (Model) {
  return catchAsync(async (req, res, next) => {
    await Model.findByIdAndUpdate(req.user.id, { active: false });
    res.status(204);
    res.json({
      status: 'Success',
      data: null,
    });
  });
};

exports.restrictToAprovedUser = (req, res, next) => {
  if (!req.user.approved)
    return next(
      new AppError('Your account is awaiting approval by an admin', 401)
    );
  next();
};

const currentUserAccount = (Model) => {
  return catchAsync(async (req, res, next) => {
    const currentUser = await Model.findById(req.user._id);

    res.status(200);
    res.json({
      status: 'success',
      data: {
        data: currentUser,
      },
    });
  });
};

// GET CURRENT USER ACCOUNTS
exports.getSuperAdminAccount = currentUserAccount(SuperAdmin);
exports.getAdminAccount = currentUserAccount(Admin);
exports.getDoctorAccount = currentUserAccount(Doctor);
exports.getPatientAccount = currentUserAccount(Patient);

// UPDATE CURRENT USER ACCOUNTS
exports.updateSuperAdminAccount = updateUserAccount(SuperAdmin);
exports.updateAdminAccount = updateUserAccount(Admin);
exports.updateDoctorAccount = updateUserAccount(Doctor);
exports.updatePatientAccount = updateUserAccount(Patient);

// DELETE CURRENT USER ACCOUNTS
exports.deleteSuperAdminAccount = deleteUserAccount(SuperAdmin);
exports.deleteAdminAccount = deleteUserAccount(Admin);
exports.deleteDoctorAccount = deleteUserAccount(Doctor);
exports.deletePatientAccount = deleteUserAccount(Patient);
