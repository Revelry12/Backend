const express = require('express');
const Report = require('../models/Report');
const auth = require('../middleware/auth');
const router = express.Router();

// Create new report
router.post('/', auth, async (req, res) => {
  try {
    console.log('Creating report for user:', req.user.email);
    console.log('Request body:', req.body); // Debug log
    
    const { description, category, location, coordinates, images } = req.body;

    // Validate required fields dengan logging yang lebih detail
    if (!description) {
      console.log('Missing description');
      return res.status(400).json({
        success: false,
        message: 'Deskripsi wajib diisi'
      });
    }
    
    if (!category) {
      console.log('Missing category');
      return res.status(400).json({
        success: false,
        message: 'Kategori wajib diisi'
      });
    }
    
    if (!location) {
      console.log('Missing location');
      return res.status(400).json({
        success: false,
        message: 'Lokasi wajib diisi'
      });
    }
    
    if (!coordinates) {
      console.log('Missing coordinates');
      return res.status(400).json({
        success: false,
        message: 'Koordinat lokasi wajib diisi'
      });
    }
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      console.log('Missing or invalid images:', images);
      return res.status(400).json({
        success: false,
        message: 'Minimal 1 gambar wajib diupload'
      });
    }
    
    // Validate description length (minimal 50 karakter)
    if (description.length < 50) {
      return res.status(400).json({
        success: false,
        message: 'Deskripsi minimal harus 50 karakter'
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
      userId: req.user.id // atau req.user._id
    });

    console.log('Saving report to database...');
    const savedReport = await newReport.save();
    console.log('Report saved successfully:', savedReport._id);

    res.status(201).json({
      success: true,
      message: 'Laporan berhasil dibuat',
      data: {
        id: savedReport._id,
        status: savedReport.status,
        createdAt: savedReport.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating report:', error);
    console.error('Error stack:', error.stack);
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

// Get single image by report ID and image index
router.get('/:id/images/:imageIndex', auth, async (req, res) => {
  try {
    const { id, imageIndex } = req.params;
    const index = parseInt(imageIndex);

    const report = await Report.findOne({
      _id: id,
      userId: req.user.id
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Laporan tidak ditemukan'
      });
    }

    if (index < 0 || index >= report.images.length) {
      return res.status(404).json({
        success: false,
        message: 'Gambar tidak ditemukan'
      });
    }

    const image = report.images[index];
    
    // Extract base64 data (remove data:image/jpeg;base64, prefix)
    const base64Data = image.data.replace(/^data:image\/[a-z]+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Set appropriate headers
    res.set({
      'Content-Type': image.contentType,
      'Content-Length': imageBuffer.length,
      'Cache-Control': 'public, max-age=86400' // Cache for 1 day
    });

    res.send(imageBuffer);
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

// Get all images for a report as URLs
router.get('/:id/images', auth, async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).select('images.contentType images.filename');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Laporan tidak ditemukan'
      });
    }

    const imageUrls = report.images.map((image, index) => ({
      index,
      url: `/api/reports/${req.params.id}/images/${index}`,
      contentType: image.contentType,
      filename: image.filename
    }));

    res.json({
      success: true,
      data: imageUrls
    });
  } catch (error) {
    console.error('Error fetching image URLs:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

// Admin endpoint - Get all reports with image previews (requires admin auth)
router.get('/admin/all-reports', auth, async (req, res) => {
  try {
    // Add admin check here if you have admin role system
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ success: false, message: 'Access denied' });
    // }

    const reports = await Report.find({})
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    // Transform data to include image count and first image preview
    const reportsWithImageInfo = reports.map(report => ({
      _id: report._id,
      description: report.description,
      category: report.category,
      location: report.location,
      user: report.userId,
      createdAt: report.createdAt,
      status: report.status,
      imageCount: report.images.length,
      firstImagePreview: report.images.length > 0 ? {
        contentType: report.images[0].contentType,
        filename: report.images[0].filename,
        size: report.images[0].size
      } : null
    }));

    res.json({
      success: true,
      data: reportsWithImageInfo
    });
  } catch (error) {
    console.error('Error fetching all reports:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

// Admin endpoint - Get specific image by report ID and image index
router.get('/admin/:id/images/:imageIndex', auth, async (req, res) => {
  try {
    // Add admin check here if you have admin role system
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ success: false, message: 'Access denied' });
    // }

    const { id, imageIndex } = req.params;
    const index = parseInt(imageIndex);

    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Laporan tidak ditemukan'
      });
    }

    if (index < 0 || index >= report.images.length) {
      return res.status(404).json({
        success: false,
        message: 'Gambar tidak ditemukan'
      });
    }

    const image = report.images[index];
    
    // Extract base64 data
    const base64Data = image.data.replace(/^data:image\/[a-z]+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Set headers
    res.set({
      'Content-Type': image.contentType,
      'Content-Length': imageBuffer.length,
      'Content-Disposition': `inline; filename="${image.filename}"`,
      'Cache-Control': 'public, max-age=86400'
    });

    res.send(imageBuffer);
  } catch (error) {
    console.error('Error fetching admin image:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

// Admin endpoint - Get all images for a specific report
router.get('/admin/:id/all-images', auth, async (req, res) => {
  try {
    // Add admin check here if you have admin role system
    
    const report = await Report.findById(req.params.id)
      .populate('userId', 'name email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Laporan tidak ditemukan'
      });
    }

    const imageDetails = report.images.map((image, index) => ({
      index,
      filename: image.filename,
      contentType: image.contentType,
      size: image.size,
      url: `/api/reports/admin/${req.params.id}/images/${index}`,
      base64Preview: image.data.substring(0, 100) + '...' // First 100 chars for preview
    }));

    res.json({
      success: true,
      data: {
        report: {
          _id: report._id,
          description: report.description,
          category: report.category,
          location: report.location,
          user: report.userId,
          createdAt: report.createdAt,
          status: report.status
        },
        images: imageDetails
      }
    });
  } catch (error) {
    console.error('Error fetching admin report images:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

module.exports = router;