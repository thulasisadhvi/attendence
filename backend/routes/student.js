// routes/student.js
const express = require('express');
const router = express.Router();
const storeStudent = require('../controllers/studentStore');

router.post('/', storeStudent); // POST /api/students

module.exports = router;
