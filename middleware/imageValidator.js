const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Local storage configuration
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5
  },
  fileFilter: (req, file, cb) => {
    // Basic MIME type validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Local image validation function
const validateImageLocally = async (buffer) => {
  try {
    const metadata = await sharp(buffer).metadata();
    
    // Check if it's a valid image
    if (!metadata.format) return false;
    
    // Check dimensions (reasonable limits)
    if (metadata.width < 50 || metadata.height < 50) return false;
    if (metadata.width > 4000 || metadata.height > 4000) return false;
    
    return true;
  } catch (error) {
    return false;
  }
};

// Process and sanitize image
const processImage = async (buffer) => {
  return await sharp(buffer)
    .resize(1920, 1920, { 
      fit: 'inside', 
      withoutEnlargement: true 
    })
    .jpeg({ quality: 85 })
    .toBuffer();
};

module.exports = {
  upload,
  validateImageLocally,
  processImage
};