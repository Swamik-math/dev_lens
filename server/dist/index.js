"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const AnalyzerService_1 = require("./analyzer/AnalyzerService");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5001;
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '5mb' }));
const analyzerService = new AnalyzerService_1.AnalyzerService();
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'DevLens Analysis API',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});
// Code Analysis Endpoint
app.post('/api/analyze', async (req, res) => {
    try {
        const { code, language, includeAi } = req.body;
        if (!code || typeof code !== 'string') {
            return res.status(400).json({ error: 'Valid "code" string is required.' });
        }
        if (!language) {
            return res.status(400).json({ error: 'Target "language" is required.' });
        }
        const result = await analyzerService.analyze({ code, language, includeAi });
        return res.json(result);
    }
    catch (error) {
        console.error('Analysis failed:', error);
        return res.status(500).json({
            error: 'An unexpected error occurred during code analysis.',
            details: error?.message || 'Internal Server Error'
        });
    }
});
app.listen(PORT, () => {
    console.log(`🚀 DevLens API Server is listening on http://localhost:${PORT}`);
});
