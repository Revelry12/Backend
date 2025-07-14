const express = require('express');
const Report = require('../models/Report');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Middleware untuk cek admin role
const adminAuth = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Hanya admin yang dapat mengakses.'
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Admin - Get all reports with image previews
router.get('/reports', auth, adminAuth, async (req, res) => {
  try {
    const reports = await Report.find({})
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

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

// Admin - Get specific image by report ID and image index
router.get('/reports/:id/images/:imageIndex', auth, adminAuth, async (req, res) => {
  try {
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
    const base64Data = image.data.replace(/^data:image\/[a-z]+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

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

// Admin - Get all images for a specific report
router.get('/reports/:id/images', auth, adminAuth, async (req, res) => {
  try {
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
      url: `/api/admin/reports/${req.params.id}/images/${index}`,
      base64Preview: image.data.substring(0, 100) + '...'
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

// Admin - Update report status
router.patch('/reports/:id/status', auth, adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'in_progress', 'resolved', 'rejected'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status tidak valid'
      });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('userId', 'name email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Laporan tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Status laporan berhasil diperbarui',
      data: report
    });
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

// Admin - Get specific report details
router.get('/reports/:id', auth, adminAuth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('userId', 'name email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Laporan tidak ditemukan'
      });
    }

    // Return full report data including images for admin
    res.json({
      success: true,
      data: {
        _id: report._id,
        description: report.description,
        category: report.category,
        location: report.location,
        user: report.userId,
        createdAt: report.createdAt,
        status: report.status,
        images: report.images.map((image, index) => ({
          index,
          filename: image.filename,
          contentType: image.contentType,
          size: image.size
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching report details:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

// Admin - Get dashboard statistics
router.get('/dashboard/stats', auth, adminAuth, async (req, res) => {
  try {
    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const resolvedReports = await Report.countDocuments({ status: 'resolved' });
    const totalUsers = await User.countDocuments({ role: 'user' });

    const recentReports = await Report.find({})
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('-images.data');

    res.json({
      success: true,
      data: {
        stats: {
          totalReports,
          pendingReports,
          resolvedReports,
          totalUsers
        },
        recentReports
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

module.exports = router;