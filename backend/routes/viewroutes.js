const express = require('express');
const { getStudentDashboardByRollNumber } = require('../controllers/viewcontroller');

const router = express.Router();

// Route to get student dashboard data by roll number
// GET /api/view/dashboard/student/:rollNumber
router.get('/dashboard/student/:rollNumber', getStudentDashboardByRollNumber);

module.exports = router;