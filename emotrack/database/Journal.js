
import mongoose from 'mongoose';

const JournalSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // Changed from Student to User to match our auth model
    required: true,
  },
  entryText: {
    type: String,
    required: true,
  },
  entryDate: {
    type: Date,
    default: Date.now,
  },
  mood: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  tags: [String]
});

export default mongoose.model('Journal', JournalSchema);

