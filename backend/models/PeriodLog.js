const mongoose = require('mongoose');

const periodLogSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  timestamp: { type: String, required: true },
  status: { type: String, required: true, default: 'active' },
  year: { type: String, required: true },
  semester: { type: String, required: true },
  department: { type: String, required: true },
  section: { type: String, required: true },
  subject: { type: String, required: true },
  block: { type: String, required: true },
  room: { type: String, required: true },
  period: { type: String, required: true },
  facultyName: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('PeriodLog', periodLogSchema, 'periodLogs');