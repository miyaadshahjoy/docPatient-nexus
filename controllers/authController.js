const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Admin = require('./../models/adminsModel');
const Doctor = require('./../models/doctorsModel');
const Patient = require('./../models/patientsModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');
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

// Impl: store user role on cookies
const storeRoleOnCookie = function (role, res) {
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('role', role, cookieOptions);
};
/*
// Impl: clear user role from the cookies
const clearRoleFromCookie = function (res) {
  res.clearCookie('role');
};*/

// Impl: Email Verification
const sendEmailVerificationToken = async function (req, next, user) {
  // TODO: 1) Create email verification token
  const verificationToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });
  // TODO: 2) Store the token on DB
  // TODO: 3) Send verification Email
  const resource = `${user.role}s`;
  const verificationUrl = `${req.protocol}://${req.hostname}/api/v1/${resource}/verify-email/${verificationToken}`;
  // const message = `To verify your email click on this link: ${verificationUrl}`;
  try {
    new Email(user, verificationUrl).sendVerifyEmail();
  } catch (err) {
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpire = undefined;
    await user.save();
    return next(
      new AppError(
        'There was an error sending the email for Email Verification. Please try later!',
        400
      )
    );
  }
};

// Impl: Protect routes
exports.protect = catchAsync(async (req, res, next) => {
  // TODO: 1) Getting the JWT token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ').at(-1);
  }
  // Getting role from cookies
  const role = req.cookies.role;
  if (role === 'superAdmin') {
    Model = SuperAdmin;
  } else if (role === 'admin') {
    Model = Admin;
  } else if (role === 'doctor') {
    Model = Doctor;
  } else if (role === 'patient') {
    Model = Patient;
  }
  // if (role !== req.cookies.role)
  //   return next(
  //     new AppError('You are not authorized to perform this action🚫🚫', 401)
  //   );

  // TODO: 2) Verification of token
  if (!token)
    return next(new AppError('The token is invalid or has expired', 401));
  // TODO: 3) Check if user still exists
  const decodedDocument = jwt.verify(token, process.env.JWT_SECRET_KEY);

  const currentUser = await Model.findById(decodedDocument.id);

  if (!currentUser)
    return next(
      new AppError('The user belonging to this token does no longer exist', 401)
    );
  // TODO: 4) Check if user changed password after the token was issued

  if (currentUser.passwordChangedAfter(decodedDocument.iat))
    return next(
      new AppError('User changed password recently. Please login again!', 401)
    );
  req.user = currentUser;
  next();
});

// Impl: Authorization
const restrict = function (...roles) {
  return (req, res, next) => {
    const userRole = req.user.role;
    console.log(userRole, roles);
    if (!roles.includes(userRole))
      return next(
        new AppError(`You are not authorized to perform this action🙄😑`, 403)
      );
    next();
  };
};

// Impl: SIGN UP Handler
const signup = function (Model) {
  return catchAsync(async (req, res, next) => {
    const user = await Model.create(req.body);

    // TODO: send Email verification email
    sendEmailVerificationToken(req, next, user);
    storeRoleOnCookie(user.role, res);
    sendToken(user, 201, res);
  });
};

// Impl: SIGN IN Handler
const signin = function (Model) {
  return catchAsync(async (req, res, next) => {
    // TODO: 1) Check if email and password exist
    const { email, password } = req.body;
    if (!email || !password)
      return next(new AppError('Please provide email and password', 400));
    // TODO: 2) Check if admin exists and password is correct
    const user = await Model.findOne({ email }).select('+password');
    if (!user || !(await user.correctPassword(password, user.password)))
      return next(new AppError('Incorrect email or password', 401));
    if (!user.approved)
      return next(new AppError('Your account is not yet approved', 403));
    // TODO: 3) If everything is ok, send token to client
    storeRoleOnCookie(user.role, res);
    // clearRoleFromCookie(res);

    sendToken(user, 200, res);
  });
};

// Impl: Forgot Password
exports.forgotPassword = function (Model) {
  return catchAsync(async (req, res, next) => {
    // TODO: 1) Get user based on POSTed email
    const { email } = req.body;
    const currentUser = await Model.findOne({ email });
    if (!currentUser) {
      return next(new AppError('There is no user exist with this email', 401));
    }
    // TODO: 2) Generate the random reset token
    const resetToken = currentUser.createPasswordResetToken();
    await currentUser.save({ validateBeforeSave: false });
    // TODO: 3) Send it to user's email
    const resource =
      `${Model.modelName}`.slice(0, 1).toLocaleLowerCase() +
      `${Model.modelName}`.slice(1);
    const resetUrl = `${req.protocol}://${req.hostname}/api/v1/${resource}/resetPassword/${resetToken}`;
    const message = `Forgot password? Send a POST request with password and passwodConfirm to: ${resetUrl}\nIf you didn't forget your password, ignore this email`;

    try {
      await sendEmail({
        email: currentUser.email,
        subject: `Password reset token (Expires in 10 minutes)`,
        message,
      });
      res.status(200);
      res.json({
        status: 'Success',
        message: 'Token sent to email',
      });
    } catch (err) {
      currentUser.passwordResetToken = undefined;
      currentUser.passwordResetTokenExpire = undefined;
      await currentUser.save({ validateBeforeSave: false });
      return next(
        new AppError(
          'There was an error sending email. Please try again later!',
          500
        )
      );
    }
  });
};

// Impl: Reset Password

exports.resetPassword = function (Model) {
  return catchAsync(async (req, res, next) => {
    const { newPassword, newPasswordConfirm } = req.body;
    const resetToken = req.params.resetToken;

    // TODO: 1) Get user based on the token
    const hashedResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    const currentUser = await Model.findOne({
      passwordResetToken: hashedResetToken,
      passwordResetTokenExpire: { $gt: Date.now() },
    }).select('+password');

    if (!currentUser)
      return next(new AppError('Token is invalid or has expired', 400));

    // TODO: 2) If token has not expired, and there is user, set the new password
    currentUser.password = newPassword;
    currentUser.passwordConfirm = newPasswordConfirm;
    currentUser.passwordResetToken = undefined;
    currentUser.passwordResetTokenExpire = undefined;
    await currentUser.save({ validateBeforeSave: false });

    // TODO: 3) Update passwordChangedAt property for the user
    // TODO: 4) Log the user in, Send JWT
    sendToken(currentUser, 200, res);
  });
};

// Impl: Verify email

exports.verifyEmail = catchAsync(async (req, res, next) => {
  const { verificationToken } = req.params;
  const currentUser = req.user;

  if (
    crypto.createHash('sha256').update(verificationToken).digest('hex') !==
    currentUser.emailVerificationToken
  )
    return next(new AppError('Token is invalid or has expired', 400));
  currentUser.emailVerified = true;
  currentUser.emailVerificationToken = undefined;
  currentUser.emailVerificationTokenExpire = undefined;
  await currentUser.save({
    validateBeforeSave: false,
  });
  sendToken(currentUser, 200, res);
});

// Impl: Update Password

exports.updatePassword = function (Model) {
  return catchAsync(async (req, res, next) => {
    // TODO: 1) Get user from the collection
    const currentUser = await Model.findById(req.user).select('+password');
    // TODO: 2) Check if POSTed current password is correct
    if (
      !(await currentUser.correctPassword(
        req.body.currentPassword,
        currentUser.password
      ))
    )
      return next(new AppError('Incorrect Password!...🚫🚫'));

    // TODO: 3) If current password is correct, update the password
    currentUser.password = req.body.updatedPassword;
    currentUser.save({ validateBeforeSave: false });
    // TODO: 4) Log user in, send JWT
    // FIXME: Password is visible on the client
    sendToken(currentUser, 200, res);
  });
};

// SIGN UP
exports.signupSuperAdmin = signup(SuperAdmin);
exports.signupAdmin = signup(Admin);
exports.signupDoctor = signup(Doctor);
exports.signupPatient = signup(Patient);

// SIGN IN
exports.signinSuperAdmin = signin(SuperAdmin);
exports.signinAdmin = signin(Admin);
exports.signinDoctor = signin(Doctor);
exports.signinPatient = signin(Patient);

// AUTHORIZE
exports.restrictToSuperAdmin = restrict('superAdmin');
exports.restrictToAdmin = restrict('admin');
exports.restrictToDoctor = restrict('doctor');
exports.restrictToPatient = restrict('patient');
exports.restrictToAdminPatient = restrict('admin', 'patient');
exports.restrictToDoctorPatient = restrict('doctor', 'patient');
