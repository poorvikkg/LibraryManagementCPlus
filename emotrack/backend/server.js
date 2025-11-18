import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

import userRoutes from "./routes/userRoutes.js";
import emotionRoutes from "./routes/emotionRoutes.js";
import journalRoutes from "./routes/journalRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

dotenv.config();
connectDB();

const app = express();

// Configure CORS to accept requests from any local development server
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if(!origin) return callback(null, true);
        
        // Allow any localhost origin
        if(origin.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:[0-9]+)?$/)) {
            return callback(null, true);
        }
        
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    optionsSuccessStatus: 200
}));

// Parse JSON bodies
app.use(express.json());

// Handle malformed JSON errors from express.json() early and return a clear 400 response
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.warn('Malformed JSON in request body:', { path: req.originalUrl });
        return res.status(400).json({ message: 'Malformed JSON in request body' });
    }
    next(err);
});

// Log all API requests in development
if (process.env.NODE_ENV !== 'production') {
    app.use('/api', (req, res, next) => {
        console.log(`${req.method} ${req.originalUrl}`, {
            body: req.body,
            auth: req.headers.authorization ? 'Present' : 'Missing'
        });
        next();
    });
}

// Routes
app.use("/api/users", userRoutes);
app.use("/api/emotions", emotionRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api/chat", chatRoutes);

// Simple health endpoint to verify API is running
app.get('/api/ping', (req, res) => {
	res.json({ ok: true, time: new Date().toISOString() });
});

// Log mounted routes (simple confirmation)
console.log('Mounted routes: /api/users, /api/emotions, /api/journal, /api/chat');

// Return JSON for unknown /api/* routes instead of Express HTML 404 — helps frontend debug
app.use('/api', (req, res) => {
	res.status(404).json({ message: 'API route not found', path: req.originalUrl });
});

app.get("/", (req, res) => res.send("🎯 EmoTrack Backend Running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
