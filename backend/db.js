// db.js
// This file is responsible for establishing and maintaining the connection to MongoDB.

const mongoose = require('mongoose'); // Import Mongoose for MongoDB interaction
require('dotenv').config(); // Load environment variables from .env file

// Load the MongoDB connection URI from environment variables
const MONGODB_URI = process.env.MONGO_URI;

const connectDB = async () => {
  try {
    // Check if the URI is defined
    if (!MONGODB_URI) {
      throw new Error('MONGO_URI is not defined in your .env file or environment variables.');
    }

    // Attempt to connect to MongoDB (no deprecated options needed for Mongoose 6+)
    await mongoose.connect(MONGODB_URI);

    console.log('✅ MongoDB Connected Successfully!');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1); // Stop the app if connection fails
  }
};

module.exports = connectDB; // Export the connection function
