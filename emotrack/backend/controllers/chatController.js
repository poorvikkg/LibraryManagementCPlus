import dotenv from "dotenv";

dotenv.config();

// Google Generative AI (Gemini 2.5) direct endpoint
const GOOGLE_API_KEY = process.env.GEMINI_API_KEY; // Use the API key from .env
const GOOGLE_MODEL = process.env.GOOGLE_MODEL || 'gemini-2.5-flash'; // Gemini 2.5 model
const GOOGLE_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GOOGLE_MODEL}:generateContent`;

// Mental-stabilizer system prompt for the Gemini model
const SYSTEM_PROMPT = `You are a compassionate, encouraging, non-judgmental mental-state stabilizer. Your goal is to provide short, empathetic, motivating, and grounding responses to help users cope with stress, anxiety, and low mood. 

Guidelines:
- Use calm, warm language and validate feelings without judgment
- Suggest small actionable coping steps (breathing exercises, grounding techniques, journaling, talking to a trusted person)
- Encourage professional help if someone expresses suicidal ideation or severe distress
- Keep responses brief (1-3 short paragraphs) unless asked for more detail
- Never provide medical or legal advice
- Always be hopeful and remind them that they're not alone and that these feelings will pass
- End with an encouraging note or gentle action suggestion

Remember: Your role is to support and encourage, not to replace professional mental health services.`;

export const chat = async (req, res) => {
  try {
    if (!GOOGLE_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured in environment' });
    }

    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Invalid payload: messages must be a non-empty array' });
    }

    // Build the request for Google Generative AI (Gemini 2.5)
    // Format: system instruction + conversation history
    const contents = [];
    
    // Add system instruction as the first exchange
    contents.push({
      role: 'user',
      parts: [{ text: SYSTEM_PROMPT }]
    });
    contents.push({
      role: 'model',
      parts: [{ text: 'I understand. I am here to support and encourage you with compassion and care.' }]
    });

    // Add the actual conversation messages
    for (const msg of messages) {
      const role = msg.role === 'assistant' ? 'model' : 'user';
      contents.push({
        role,
        parts: [{ text: msg.content }]
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    // Call Google Generative AI endpoint
    const requestBody = {
      contents,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 500,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
      ],
    };

    const response = await fetch(`${GOOGLE_ENDPOINT}?key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('Gemini API error response:', { status: response.status, body: errorText });
      return res.status(502).json({
        error: 'Error from Gemini API',
        status: response.status,
        details: errorText.substring(0, 200),
      });
    }

    const data = await response.json();

    // Extract the reply from Gemini's response format
    let reply;
    if (data.candidates && Array.isArray(data.candidates) && data.candidates[0]?.content?.parts) {
      reply = data.candidates[0].content.parts[0]?.text;
    }

    if (!reply) {
      console.error('Gemini API response missing text:', JSON.stringify(data));
      return res.status(502).json({ error: 'Unable to extract reply from Gemini response' });
    }

    return res.json({ reply });
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'Request to Gemini API timed out (>30s)' });
    }
    console.error('Chat controller error:', err?.message || err);
    return res.status(500).json({ error: 'Internal server error', details: err?.message });
  }
};
