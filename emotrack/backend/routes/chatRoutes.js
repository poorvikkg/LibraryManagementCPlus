import express from 'express';
import { chat } from '../controllers/chatController.js';

const router = express.Router();

// POST /api/chat  { messages: [ { role: 'user'|'assistant'|'system', content: '...' }, ... ] }
router.post('/', chat);

export default router;
