const mongoose = require('mongoose');

// Schema definition
const appointmentSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.ObjectId,
    ref: 'Doctor', // Parent referencing
    required: true,
  },
  patient: {
    type: mongoose.Schema.ObjectId,
    ref: 'Patient', // Parent referencing
    required: true,
  },
  appointmentDate: {
    type: Date,
  },
  reason: String,
  notes: String,
  status: {
    type: String,
    enum: ['pending', 'scheduled', 'completed', 'cancelled'],
    defualt: 'pending',
  },
  paymentAmount: Number,
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  },
  refund: {
    type: String,
    enum: ['processing', 'paid', 'non-refundable'],
    defualt: 'pending',
  },
  paymentMethod: String,
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: Date,
});

// Model definition
const Appointment = mongoose.model('Appointment', appointmentSchema);
module.exports = Appointment;
