const Doctor = require('../models/doctorsModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
exports.getAllDoctors = factory.readAllDocuments(Doctor);
exports.getDoctor = factory.readDocument(Doctor, [
  {
    path: 'patients',
    select: 'fullName gender address',
  },
  {
    path: 'appointments',
  },
]);

exports.findDoctorsWithin = catchAsync(async (req, res, next) => {
  // /doctors-within/:distance/center/:latlng/unit/:unit
  const distance = req.params.distance;
  const [lat, lng] = req.params.latlng.split(',').map(Number);
  const unit = req.params.unit;
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1; // radius in radian
  // console.log(radius);

  const doctors = await Doctor.find({
    workAddress: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius],
      },
    },
  });
  res.status(200);
  res.json({
    status: 'success',
    reults: doctors.length,
    data: {
      doctors,
    },
  });
});
exports.getDoctorDistances = catchAsync(async (req, res, next) => {
  // /distances/:latlng/unit/:unit
  const [lat, lng] = req.params.latlng.split(',').map(Number);
  const unit = req.params.unit;
  const multiplier = unit === 'mi' ? 0.000621371192 : 0.001;
  const distances = await Doctor.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng, lat],
        },

        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        fullName: 1,
        distance: 1,
      },
    },
  ]);
  res.status(200);
  res.json({
    status: 'success',
    resutlts: distances.length,
    data: {
      distances,
    },
  });
});

exports.addDoctor = factory.createOne(Doctor);
exports.updateDoctor = factory.updateOne(Doctor);
exports.removeDoctor = factory.deleteOne(Doctor);
