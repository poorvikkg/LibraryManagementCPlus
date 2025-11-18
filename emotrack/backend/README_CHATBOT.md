Gemini 2.5 Chatbot (Mental-State Stabilizer)
=============================================

What this does
--------------
A mental-health focused chatbot that calls **Google Gemini 2.5 directly** to provide empathetic, encouraging, and grounding responses. The backend acts as a secure proxy so API keys stay server-side.

Features
--------
- Direct integration with Google Generative AI (Gemini 2.5 model)
- Mental-stabilizer system prompt to encourage and motivate users
- Conversation history maintained by frontend
- Safety guardrails (blocks harassment, hate speech, explicit content, dangerous content)
- Compassionate, brief responses (up to 500 tokens)

Configuration
--------------
Your `.env` file in `backend/` already has:
```
GEMINI_API_KEY=AIzaSyAWI6Pd9hJRUD9454j-0bKvHGFYAESMJmw
```
The backend uses this key to call:
`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`

Optional override model:
```
GOOGLE_MODEL=gemini-2.5-flash
```

Running locally
---------------
1. Install dependencies:
   ```
   npm install
   ```

2. Start the backend (from `backend/` folder):
   ```
   node server.js
   ```

3. Open the frontend in your browser and chat!

Testing the API
---------------
From PowerShell with curl.exe:
```powershell
curl.exe -X POST "http://localhost:5000/api/chat" `
  -H "Content-Type: application/json" `
  -d '{"messages":[{"role":"user","content":"I feel anxious today"}]}'
```

How it works
------------
1. Frontend sends message to backend `/api/chat`
2. Backend calls Google Gemini 2.5 with system prompt (mental-stabilizer)
3. Backend returns reply to frontend
4. Frontend displays and stores conversation history

Security
--------
- API key stays on server (never in frontend)
- Safety filters enabled (no harmful content)
- Consider rate-limiting and monitoring in production
