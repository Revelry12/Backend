const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const reportRoutes = require('./routes/reports');
const path = require('path');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));

// Increase payload limit for base64 images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reports', reportRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Lapor-in Backend API' });
});

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add upload routes
app.use('/api/upload', uploadRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});