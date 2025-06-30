// db.js
// This file is responsible for establishing and maintaining the connection to MongoDB.

const mongoose = require('mongoose'); // Import the Mongoose library for MongoDB OGM
require('dotenv').config(); // Load environment variables from .env file

// Define the MongoDB connection URI.
// It's highly recommended to use environment variables for sensitive information
// like database URIs, especially in production.
// For a local MongoDB instance, it might look like: 'mongodb://localhost:27017/your_database_name'
// For MongoDB Atlas, it will be a longer connection string provided by Atlas.
// Now, MONGODB_URI will be loaded from your .env file
const MONGODB_URI = process.env.MONGO_URI;
const connectDB = async () => {
  try {
    // Check if MONGODB_URI is defined
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in your .env file or environment variables.');
    }

    // Attempt to connect to MongoDB using the URI
    await mongoose.connect(MONGODB_URI, {
      // These options are recommended for new connections to avoid deprecation warnings
      // and ensure stable connections.
      useNewUrlParser: true,      // Use the new URL parser
      useUnifiedTopology: true,   // Use the new server discovery and monitoring engine
      // useCreateIndex: true,    // Mongoose 6.0+ no longer supports useCreateIndex
      // useFindAndModify: false  // Mongoose 6.0+ no longer supports useFindAndModify
    });
    console.log('MongoDB Connected Successfully!'); // Log success message
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message); // Log error message
    // Exit process with failure if connection fails
    process.exit(1);
  }
};

module.exports = connectDB; // Export the connectDB function for use in server.js

