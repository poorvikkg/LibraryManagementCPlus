import mongoose from 'mongoose';

const JournalSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
    default: null
  },
  tags: [String]
});

export default mongoose.model('Journal', JournalSchema);