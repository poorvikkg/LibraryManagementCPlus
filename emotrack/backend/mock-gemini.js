import express from 'express';
import cors from 'cors';

// Simple mock Gemini-Flask server for local testing
// POST /v1/chat  { messages: [ { role, content }, ... ] }
// Returns { reply: '...' }

const PORT = 8080;
const app = express();
app.use(cors());
app.use(express.json());

app.post('/v1/chat', (req, res) => {
  try {
    const messages = req.body?.messages || [];
    // Find the last user message
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    const text = lastUser?.content || '';

    // Very small mental-stabilizer style canned reply
    const reply = text
      ? `I hear you. Thank you for sharing — it can help to take one small breath right now. If you'd like, tell me more or say what feels most pressing.`
      : `Hi — I'm here to listen. What would you like to talk about?`;

    return res.json({ reply });
  } catch (err) {
    console.error('Mock Gemini error', err);
    return res.status(500).json({ error: 'mock server error' });
  }
});

app.get('/health', (req, res) => res.json({ ok: true, port: PORT }));

app.listen(PORT, () => console.log(`Mock Gemini-Flask running on http://localhost:${PORT}/v1/chat`));
