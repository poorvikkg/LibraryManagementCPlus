
const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  studentId: {
    type: String,
    required: true,
    unique: true,
  },
  department: String,
  year: Number,
  courseList: [String],
  contactInfo: {
    phone: String,
    address: String
  }
});

module.exports = mongoose.model('Student', StudentSchema);

