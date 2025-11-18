import Emotion from "../models/Emotion.js";

export const addEmotion = async (req, res) => {
  try {
    const { mood, intensity, notes } = req.body;
    const emotion = await Emotion.create({
      userId: req.user.id,
      mood,
      intensity,
      notes
    });
    res.status(201).json(emotion);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const getEmotions = async (req, res) => {
  try {
    const emotions = await Emotion.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(emotions);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
