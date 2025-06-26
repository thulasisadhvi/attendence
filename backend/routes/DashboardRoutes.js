const express = require('express');
const router = express.Router();

const { getStudentDashboard } = require('../controllers/studentDashboardController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Student Dashboard (Protected Route)
router.get('/dashboard', verifyToken, getStudentDashboard);

module.exports = router;
