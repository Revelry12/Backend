const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import model
const Report = require('../models/Report');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lapor-in');

async function extractAllImages() {
  try {
    const reports = await Report.find({}).populate('userId', 'name email');
    
    // Create output directory
    const outputDir = path.join(__dirname, '../extracted-images');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`Found ${reports.length} reports`);
    
    let totalImages = 0;
    
    for (const report of reports) {
      const reportDir = path.join(outputDir, `report-${report._id}`);
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }
      
      // Create report info file
      const reportInfo = {
        id: report._id,
        description: report.description,
        category: report.category,
        user: report.userId,
        createdAt: report.createdAt,
        imageCount: report.images.length
      };
      
      fs.writeFileSync(
        path.join(reportDir, 'report-info.json'),
        JSON.stringify(reportInfo, null, 2)
      );
      
      // Extract images
      for (let i = 0; i < report.images.length; i++) {
        const image = report.images[i];
        
        try {
          // Remove data URL prefix
          const base64Data = image.data.replace(/^data:image\/[a-z]+;base64,/, '');
          const imageBuffer = Buffer.from(base64Data, 'base64');
          
          // Get file extension from content type
          const ext = image.contentType.split('/')[1] || 'jpg';
          const filename = `image-${i + 1}.${ext}`;
          
          fs.writeFileSync(path.join(reportDir, filename), imageBuffer);
          
          console.log(`Extracted: ${report.category} - ${filename}`);
          totalImages++;
        } catch (error) {
          console.error(`Error extracting image ${i + 1} from report ${report._id}:`, error.message);
        }
      }
    }
    
    console.log(`\nExtraction complete!`);
    console.log(`Total images extracted: ${totalImages}`);
    console.log(`Output directory: ${outputDir}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the extraction
extractAllImages();