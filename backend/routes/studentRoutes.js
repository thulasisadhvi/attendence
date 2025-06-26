// C:\Users\saisa\OneDrive\Desktop\Project4.0\backend\node-server\routes\studentRoutes.js
const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController'); // Import controller functions

// Define API endpoints for students
// GET /api/students - Get all students
router.get('/', studentController.getAllStudents);

// PUT /api/students/:id - Update a student by ID
router.put('/:id', studentController.updateStudent);

module.exports = router;