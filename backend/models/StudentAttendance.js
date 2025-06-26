// models/StudentAttendance.js
// This model will store individual student attendance records.

const mongoose = require('mongoose');

// Define schema for subjects array within student attendance
const subjectAttendanceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  attendedClasses: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
}, { _id: false }); // _id: false means Mongoose won't create an _id for subdocuments

// Define the main StudentAttendance Schema
const studentAttendanceSchema = new mongoose.Schema({
  rollNumber: {
    type: String,
    required: true,
    unique: true, // Assuming rollNumber is unique for each student attendance record
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  department: {
    type: String,
    required: true,
    trim: true,
  },
  semester: {
    type: String,
    required: true,
    trim: true,
  },
  section: {
    type: String,
    required: true,
    trim: true,
  },
  subjects: [subjectAttendanceSchema], // Array of subject attendance subdocuments
  totalAttendedClasses: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  // Dates will be stored as a Mongoose Map to handle dynamic keys (date strings)
  dates: {
    type: Map,
    of: Number, // Values will be numbers (e.g., count of classes on that date)
    default: {},
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  collection: 'studentattendances' // Explicitly set collection name
});

const StudentAttendance = mongoose.model('StudentAttendance', studentAttendanceSchema);

module.exports = StudentAttendance;
