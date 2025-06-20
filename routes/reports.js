const express = require('express');
const Report = require('../models/Report');
const auth = require('../middleware/auth');
const router = express.Router();

// Create new report
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, category, location, coordinates, images } = req.body;

    // Validate required fields
    if (!title || !description || !category || !location || !coordinates || !images || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Semua field wajib diisi dan minimal 1 gambar'
      });
    }

    // Validate image count (max 3)
    if (images.length > 3) {
      return res.status(400).json({
        success: false,
        message: 'Maksimal 3 gambar'
      });
    }

    // Validate each image
    for (const image of images) {
      if (!image.data || !image.contentType || !image.filename) {
        return res.status(400).json({
          success: false,
          message: 'Data gambar tidak lengkap'
        });
      }

      // Check if base64 is valid
      if (!image.data.startsWith('data:image/')) {
        return res.status(400).json({
          success: false,
          message: 'Format gambar tidak valid'
        });
      }

      // Check image size (max 5MB in base64)
      const base64Size = (image.data.length * 3) / 4;
      if (base64Size > 5 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: 'Ukuran gambar terlalu besar (max 5MB)'
        });
      }
    }

    // Create new report
    const newReport = new Report({
      title,
      description,
      category,
      location: {
        address: location,
        coordinates: {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          accuracy: coordinates.accuracy
        }
      },
      images,
      userId: req.user.id
    });

    const savedReport = await newReport.save();

    res.status(201).json({
      success: true,
      message: 'Laporan berhasil dibuat',
      data: {
        id: savedReport._id,
        title: savedReport.title,
        status: savedReport.status,
        createdAt: savedReport.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

// Get user reports
router.get('/my-reports', auth, async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user.id })
      .select('-images.data') // Exclude base64 data for list view
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

// Get single report with images
router.get('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Laporan tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

module.exports = router;