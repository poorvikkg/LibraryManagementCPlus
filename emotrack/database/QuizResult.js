// models/QuizResult.js
import mongoose from "mongoose";

const quizResultSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const QuizResult = mongoose.model("QuizResult", quizResultSchema);

export default QuizResult;
