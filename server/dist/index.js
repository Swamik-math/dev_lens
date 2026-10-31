"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const AnalyzerService_1 = require("./analyzer/AnalyzerService");
const database_1 = require("./db/database");
const auth_1 = require("./middleware/auth");
const githubService_1 = require("./services/githubService");
const runnerService_1 = require("./services/runnerService");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5001;
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
const analyzerService = new AnalyzerService_1.AnalyzerService();
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'DevLens Analysis API',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        geminiConfigured: !!process.env.GEMINI_API_KEY
    });
});
// ----------------------------------------------------
// 1. AUTHENTICATION ENDPOINTS
// ----------------------------------------------------
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required.' });
        }
        const existing = database_1.db.findUserByEmail(email);
        if (existing) {
            return res.status(400).json({ error: 'A user with this email already exists.' });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        const user = database_1.db.createUser(name, email, passwordHash);
        const token = (0, auth_1.generateToken)(user.id, user.email);
        return res.status(201).json({ token, user });
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Registration failed' });
    }
});
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }
        const user = database_1.db.findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }
        const token = (0, auth_1.generateToken)(user.id, user.email);
        const { passwordHash, ...safeUser } = user;
        return res.json({ token, user: safeUser });
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Login failed' });
    }
});
app.get('/api/auth/me', auth_1.requireAuthMiddleware, (req, res) => {
    const user = database_1.db.findUserById(req.userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ user });
});
// ----------------------------------------------------
// 2. DASHBOARD STATS ENDPOINT
// ----------------------------------------------------
app.get('/api/dashboard/stats', (req, res) => {
    try {
        const stats = database_1.db.getDashboardStats();
        return res.json(stats);
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to compute dashboard metrics' });
    }
});
// ----------------------------------------------------
// 3. CODE ANALYSIS ENDPOINTS
// ----------------------------------------------------
app.post('/api/analyze', auth_1.optionalAuthMiddleware, async (req, res) => {
    try {
        const { code, language, includeAi } = req.body;
        if (!code || typeof code !== 'string') {
            return res.status(400).json({ error: 'Valid "code" string is required.' });
        }
        if (!language) {
            return res.status(400).json({ error: 'Target "language" is required.' });
        }
        // Retrieve Gemini API Key from header, request body, or environment
        const geminiApiKey = req.headers['x-gemini-key'] ||
            req.body.geminiApiKey ||
            process.env.GEMINI_API_KEY;
        const result = await analyzerService.analyze({
            code,
            language,
            includeAi,
            geminiApiKey
        });
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
app.post('/api/analyze/save', auth_1.optionalAuthMiddleware, (req, res) => {
    try {
        const { name, code, language, result } = req.body;
        if (!name || !code || !language || !result) {
            return res.status(400).json({ error: 'Name, code, language, and result are required.' });
        }
        const saved = database_1.db.saveAnalysis({
            name,
            code,
            language,
            result,
            userId: req.userId
        });
        return res.status(201).json(saved);
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to save analysis report' });
    }
});
// ----------------------------------------------------
// 4. CODE EXECUTION (RUN CODE IN EDITOR)
// ----------------------------------------------------
app.post('/api/execute', async (req, res) => {
    try {
        const { code, language, stdin } = req.body;
        if (!code || typeof code !== 'string') {
            return res.status(400).json({ error: 'Valid "code" string is required to run.' });
        }
        if (!language) {
            return res.status(400).json({ error: 'Target "language" is required.' });
        }
        const executionResult = await runnerService_1.runnerService.execute({ code, language, stdin });
        return res.json(executionResult);
    }
    catch (error) {
        console.error('Execution error:', error);
        return res.status(500).json({
            stdout: '',
            stderr: `Server execution fault: ${error?.message || 'Unknown error'}`,
            exitCode: 1,
            executionTimeMs: 0,
            status: 'error'
        });
    }
});
// ----------------------------------------------------
// 5. GEMINI API SETTINGS ENDPOINT
// ----------------------------------------------------
app.post('/api/settings/gemini-key', (req, res) => {
    try {
        const { apiKey } = req.body;
        if (!apiKey || typeof apiKey !== 'string') {
            return res.status(400).json({ error: 'Valid apiKey string is required.' });
        }
        process.env.GEMINI_API_KEY = apiKey.trim();
        return res.json({
            success: true,
            message: 'Gemini API key is now active on the DevLens server!'
        });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to set Gemini API key' });
    }
});
// ----------------------------------------------------
// 6. ANALYSIS HISTORY ENDPOINTS
// ----------------------------------------------------
app.get('/api/history', auth_1.optionalAuthMiddleware, (req, res) => {
    try {
        const analyses = database_1.db.getAnalyses(req.userId);
        return res.json(analyses);
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to fetch history' });
    }
});
app.get('/api/history/:id', (req, res) => {
    const analysis = database_1.db.getAnalysisById(req.params.id);
    if (!analysis) {
        return res.status(404).json({ error: 'Analysis record not found' });
    }
    return res.json(analysis);
});
app.delete('/api/history/:id', (req, res) => {
    const deleted = database_1.db.deleteAnalysis(req.params.id);
    if (!deleted) {
        return res.status(404).json({ error: 'Analysis record not found' });
    }
    return res.json({ success: true, message: 'Analysis deleted successfully' });
});
// ----------------------------------------------------
// 7. GITHUB INTEGRATION ENDPOINTS
// ----------------------------------------------------
app.get('/api/github/repos', async (req, res) => {
    try {
        const username = req.query.username || 'supre';
        const token = req.query.token;
        const repos = await githubService_1.githubService.getUserRepos(username, token);
        return res.json(repos);
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Failed to fetch GitHub repositories' });
    }
});
app.get('/api/github/contents', async (req, res) => {
    try {
        const owner = req.query.owner;
        const repo = req.query.repo;
        const path = req.query.path || '';
        const token = req.query.token;
        if (!owner || !repo) {
            return res.status(400).json({ error: 'Owner and repo query parameters are required.' });
        }
        const contents = await githubService_1.githubService.getRepoContents(owner, repo, path, token);
        return res.json(contents);
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Failed to fetch repository contents' });
    }
});
app.post('/api/github/raw', async (req, res) => {
    try {
        const { downloadUrl, token } = req.body;
        if (!downloadUrl) {
            return res.status(400).json({ error: 'downloadUrl is required' });
        }
        const content = await githubService_1.githubService.getRawFileContent(downloadUrl, token);
        return res.json({ content });
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Failed to fetch raw file content' });
    }
});
app.listen(PORT, () => {
    console.log(`🚀 DevLens API Server is listening on http://localhost:${PORT}`);
});
