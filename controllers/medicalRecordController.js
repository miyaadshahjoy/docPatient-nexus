const Patient = require('../models/patientsModel');
const catchAsync = require('../utils/catchAsync');

exports.uploadRecord = catchAsync(async (req, res, next) => {
  const patient = await Patient.findById(req.user.id);
  const fileNames = req.files.map((file) => file.filename);
  req.body.medicalRecords = patient.medicalRecords;
  req.body.medicalRecords.push(...fileNames);

  next();
});
