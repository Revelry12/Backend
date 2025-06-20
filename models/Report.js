const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['infrastruktur', 'kebersihan', 'keamanan', 'pelayanan', 'lainnya']
  },
  location: {
    address: {
      type: String,
      required: true
    },
    coordinates: {
      latitude: {
        type: Number,
        required: true
      },
      longitude: {
        type: Number,
        required: true
      },
      accuracy: {
        type: Number
      }
    }
  },
  images: [{
    data: {
      type: String, // Base64 string
      required: true
    },
    contentType: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    }
  }],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);