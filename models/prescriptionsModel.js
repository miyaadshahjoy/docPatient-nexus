const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.ObjectId,
    ref: 'Patient',
    required: [true, 'Prescription must belong to a Patient'],
  },
  doctor: {
    type: mongoose.Schema.ObjectId,
    ref: 'Doctor',
    required: [true, 'Prescription must be issued by a Doctor'],
  },
  appointment: {
    type: mongoose.Schema.ObjectId,
    ref: 'Appointment',
    required: [true, 'Prescription must be linked to an Appointment'],
  },
  prescriptionDate: {
    type: Date,
    default: Date.now(),
    required: [true, 'Prescription date is required'],
  },
  medications: [
    {
      name: {
        type: String,
        required: [true, 'medication name is required'],
      },
      dosage: {
        type: String,
        required: [true, 'dosage information is required'],
      },
      frequency: {
        type: String,
        required: [true, 'frequency of medication is required'],
      },
      duration: {
        type: String,
        required: [true, 'duration of taking medication is required'],
      },
      instruction: {
        type: String,
        default: 'No specific instructions',
      },
    },
  ],
  diagnosis: {
    type: String,
    required: [true, 'diagnosis information is required'],
  },
  notes: {
    type: String,
    default: 'No additional notes',
  },
  status: {
    type: String,
    enum: ['issued', 'revoked', 'completed'],
    default: 'issued',
  },
  followUpDate: {
    type: Date,
  },
});

const Prescription = mongoose.model('Prescription', prescriptionSchema);

module.exports = Prescription;
