const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Admin = require('../models/adminsModel');
const factory = require('./handlerFactory');

exports.getAllAdmins = factory.readAllDocuments(Admin);
exports.getAdmin = factory.readDocument(Admin);
exports.createAdmin = factory.createOne(Admin);
exports.updateAdmin = factory.updateOne(Admin);
exports.deleteAdmin = factory.deleteOne(Admin);

exports.approveUser = (Model) => {
  return catchAsync(async (req, res, next) => {
    const user = await Model.findByIdAndUpdate(
      req.params.id,
      {
        approved: true,
      },
      { new: true, runValidators: true }
    );

    if (!user) return next(new AppError('No user with this Id🚫🚫', 404));
    res.status(200);
    res.json({
      status: 'success',
      message: 'User account approved successfully',
      data: {
        user,
      },
    });
  });
};
