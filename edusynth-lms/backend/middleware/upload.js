const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter for allowed types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown'
  ];
  
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.md'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed types: ${allowedExtensions.join(', ')}`), false);
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB default
    files: 10 // Max 10 files per upload
  }
});

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size is ${(parseInt(process.env.MAX_FILE_SIZE) / 1024 / 1024).toFixed(0)}MB`
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 10 files allowed per upload.'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name. Use "documents" as the field name.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  }
  
  if (err) {
    logger.error('Upload error:', err);
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload failed.'
    });
  }
  
  next();
};

// Single file upload middleware
const uploadSingle = (fieldName) => {
  return [upload.single(fieldName), handleUploadError];
};

// Multiple files upload middleware
const uploadMultiple = (fieldName, maxCount = 10) => {
  return [upload.array(fieldName, maxCount), handleUploadError];
};

// Mixed upload middleware (for different fields)
const uploadMixed = (fields) => {
  return [upload.fields(fields), handleUploadError];
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadMixed,
  handleUploadError
};
