import express from "express";
import {
  createEmotion,
  getEmotions,
  getEmotionStats,
  getLatestEmotion
} from "../controllers/emotionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes are protected
router.use(protect);

router.route("/")
  .post(createEmotion)
  .get(getEmotions);

router.get("/stats", getEmotionStats);
router.get("/latest", getLatestEmotion);

export default router;
