import mongoose from "mongoose";

const emotionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  moodScore: { type: Number, required: true, min: 1, max: 5 }, // 1=Sad, 2=Worried, 3=Neutral, 4=Good, 5=Happy
  journalEntry: { type: String },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("Emotion", emotionSchema);
