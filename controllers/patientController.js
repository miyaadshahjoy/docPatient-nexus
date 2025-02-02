const Patient = require('../models/patientsModel');
const factory = require('./handlerFactory');

//////////////////////////////////////////////////////////////////////////
exports.getAllPatients = factory.readAllDocuments(Patient);

exports.getPatient = factory.readDocument(Patient, [
  {
    path: 'doctors',
    select: 'fullName specialization experience averageRating availibility',
  },
  {
    path: 'appointments',
  },
]);

exports.addPatient = factory.createOne(Patient);
exports.updatePatient = factory.updateOne(Patient);
exports.removePatient = factory.deleteOne(Patient);
