const multer = require('multer');
const AppError = require('../utils/appError');
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/medical-records');
  },
  filename: (req, file, cb) => {
    // patien-patientId-timestamp.pdf
    const ext = file.mimetype.split('/').at(1);
    cb(null, `patient-${req.user.id}-${Date.now()}.${ext}`);
  },
});

const multerFilter = (req, file, cb) => {
  console.log(file);
  if (file.mimetype.startsWith('application/pdf')) {
    cb(null, true);
  } else {
    cb(new AppError('Not a PDF! Please upload only pdf files', 400), false);
  }
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

module.exports = upload;
