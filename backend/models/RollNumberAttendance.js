const mongoose = require('mongoose');

const rollNumberAttendanceSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  year: { type: String, required: true },
  semester: { type: String, required: true },
  department: { type: String, required: true },
  section: { type: String, required: true },
  subject: { type: String, required: true },
  block: { type: String, required: true },
  room: { type: String, required: true },
  period: { type: String, required: true },
  facultyName: { type: String, required: true },
  timestamp: { type: String, required: true },
  status: { type: String, required: true, default: 'active' },
  attendedRollNumbers: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('RollNumberAttendance', rollNumberAttendanceSchema, 'rollNumberAttendances');