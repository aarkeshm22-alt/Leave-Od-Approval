import multer from 'multer';

// Process and store files cleanly in memory as buffers for fast Base64 translation
const storage = multer.memoryStorage();

// Strict mime-type filter constraint array logic
const fileFilter = (req, file, cb) => {
  // Enforce image files only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file format. Please upload an image file (PNG, JPEG, WebP) only.'), false);
  }
};

export const uploadODDocument = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 300 * 1024 // Mathematical constraint check: Enforce a strict 300 KB maximum limit threshold 
  }
});