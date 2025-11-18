import Emotion from "../models/Emotion.js";

// @desc    Create new emotion entry
// @route   POST /api/emotions
// @access  Private
export const createEmotion = async (req, res) => {
  try {
    const { moodScore, journalEntry } = req.body;

    const emotion = await Emotion.create({
      userId: req.user._id,
      moodScore,
      journalEntry,
    });

    res.status(201).json(emotion);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get user's emotion history
// @route   GET /api/emotions
// @access  Private
export const getEmotions = async (req, res) => {
  try {
    const emotions = await Emotion.find({ userId: req.user._id })
      .sort({ date: -1 })
      .limit(14); // Last 14 entries for the chart

    res.json(emotions);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get user's emotion statistics
// @route   GET /api/emotions/stats
// @access  Private
export const getEmotionStats = async (req, res) => {
  try {
    const emotions = await Emotion.find({ userId: req.user._id });
    
    const stats = {
      totalEntries: emotions.length,
      averageMood: emotions.length > 0 
        ? (emotions.reduce((acc, curr) => acc + curr.moodScore, 0) / emotions.length).toFixed(1)
        : 0
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get latest emotion entry
// @route   GET /api/emotions/latest
// @access  Private
export const getLatestEmotion = async (req, res) => {
  try {
    const emotion = await Emotion.findOne({ userId: req.user._id })
      .sort({ date: -1 });

    res.json(emotion);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};