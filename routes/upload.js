const express = require('express');
const { upload, validateImageLocally, processImage } = require('../middleware/imageValidator');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const router = express.Router();

router.post('/images', upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const processedImages = [];

    for (const file of req.files) {
      // Validate image
      if (!await validateImageLocally(file.buffer)) {
        return res.status(400).json({ 
          error: `Invalid image: ${file.originalname}` 
        });
      }

      // Process image
      const processedBuffer = await processImage(file.buffer);
      
      // Generate secure filename
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2);
      const filename = `${timestamp}_${random}.jpg`;
      const filepath = path.join(__dirname, '../uploads', filename);
      
      // Save to local filesystem
      await fs.writeFile(filepath, processedBuffer);
      
      processedImages.push({
        filename,
        originalName: file.originalname,
        size: processedBuffer.length,
        url: `/uploads/${filename}`
      });
    }

    res.json({ 
      success: true, 
      images: processedImages 
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process images' });
  }
});

module.exports = router;