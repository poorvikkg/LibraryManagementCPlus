
const mongoose = require('mongoose');

const MoodSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  mood: {
    type: String,
    enum: ['happy', 'sad', 'stressed', 'anxious', 'angry', 'neutral'],
    required: true,
  },
  note: String,
  capturedAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Mood', MoodSchema);

