const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

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
