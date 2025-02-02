const Prescription = require('../models/prescriptionsModel');
const factory = require('./handlerFactory');

exports.createPrescription = factory.createOne(Prescription);
exports.getAllPrescriptions = factory.readAllDocuments(Prescription);
