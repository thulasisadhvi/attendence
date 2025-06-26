const mongoose = require('mongoose');

const attendanceSummarySchema = new mongoose.Schema({
  department: { type: String, required: true },
  semester: { type: String, required: true },
  section: { type: String, required: true },
  attendanceSummary: {
    subjects: [
      {
        name: { type: String, required: true },
        totalClassesConducted: { type: Number, default: 0 },
      },
    ],
    totalClassesConducted: { type: Number, default: 0 },
    dates: { type: Map, of: Number, default: {} },
  },
}, { timestamps: true });
attendanceSummarySchema.index({ department: 1, semester: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceSummary', attendanceSummarySchema, 'attendanceSummaries');