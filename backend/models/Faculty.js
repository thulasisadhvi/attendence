// models/Faculty.js
// This file defines the Mongoose schema and model for faculty and admin users.
// FIX: Explicitly setting the collection name to 'faculty'.

const mongoose = require('mongoose'); // Import Mongoose

// Define the Faculty Schema
const facultySchema = new mongoose.Schema({
  // Faculty/Admin's full name
  name: {
    type: String,
    required: true,
    trim: true,
  },
  // Employee ID, required and unique for faculty/admin login
  empId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  // Role of the user, can be 'faculty' or 'admin'
  role: {
    type: String,
    required: true,
    enum: ['faculty', 'admin'], // Explicitly define allowed roles
    trim: true,
  },
  // Password (in a real app, this should be hashed, e.g., using bcrypt)
  password: {
    type: String,
    required: true,
  },
  // Department for faculty, optional for admin if not applicable
  department: {
    type: String,
    trim: true,
    // required: function() { return this.role === 'faculty'; } // Make required only for faculty
  },
  // Email, used for admin login primarily, optional for faculty if empId is primary
  email: {
    type: String,
    trim: true,
    lowercase: true,
    // unique: true, // Make unique only if all faculty/admin have unique emails
    // sparse: true // Allows null values to not violate unique constraint
  },
  // Phone number
  phone: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true // Adds createdAt and updatedAt timestamps automatically
});

// Create the Mongoose Model from the Schema
// IMPORTANT FIX: The third argument here explicitly sets the collection name to 'faculty'
const Faculty = mongoose.model('Faculty', facultySchema, 'faculty');

module.exports = Faculty; // Export the Faculty model
