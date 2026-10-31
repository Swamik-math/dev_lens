import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { AnalyzerService } from './analyzer/AnalyzerService';
import { AnalysisRequest, ExecutionRequest } from './shared/types';
import { db } from './db/database';
import { 
  generateToken, 
  optionalAuthMiddleware, 
  requireAuthMiddleware, 
  AuthenticatedRequest 
} from './middleware/auth';
import { githubService } from './services/githubService';
import { runnerService } from './services/runnerService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const analyzerService = new AnalyzerService();

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
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
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const existing = db.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const user = db.createUser(name, email, passwordHash);
    const token = generateToken(user.id, user.email);

    return res.status(201).json({ token, user });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user.id, user.email);
    const { passwordHash, ...safeUser } = user;
    return res.json({ token, user: safeUser });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Login failed' });
  }
});

app.get('/api/auth/me', requireAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = db.findUserById(req.userId!);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json({ user });
});

// ----------------------------------------------------
// 2. DASHBOARD STATS ENDPOINT
// ----------------------------------------------------
app.get('/api/dashboard/stats', (req: Request, res: Response) => {
  try {
    const stats = db.getDashboardStats();
    return res.json(stats);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to compute dashboard metrics' });
  }
});

// ----------------------------------------------------
// 3. CODE ANALYSIS ENDPOINTS
// ----------------------------------------------------
app.post('/api/analyze', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code, language, includeAi } = req.body as AnalysisRequest;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Valid "code" string is required.' });
    }

    if (!language) {
      return res.status(400).json({ error: 'Target "language" is required.' });
    }

    // Retrieve Gemini API Key from header, request body, or environment
    const geminiApiKey = 
      (req.headers['x-gemini-key'] as string) || 
      req.body.geminiApiKey || 
      process.env.GEMINI_API_KEY;

    const result = await analyzerService.analyze({ 
      code, 
      language, 
      includeAi, 
      geminiApiKey 
    });
    return res.json(result);
  } catch (error: any) {
    console.error('Analysis failed:', error);
    return res.status(500).json({
      error: 'An unexpected error occurred during code analysis.',
      details: error?.message || 'Internal Server Error'
    });
  }
});

app.post('/api/analyze/save', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, code, language, result } = req.body;
    if (!name || !code || !language || !result) {
      return res.status(400).json({ error: 'Name, code, language, and result are required.' });
    }

    const saved = db.saveAnalysis({
      name,
      code,
      language,
      result,
      userId: req.userId
    });

    return res.status(201).json(saved);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to save analysis report' });
  }
});

// ----------------------------------------------------
// 4. CODE EXECUTION (RUN CODE IN EDITOR)
// ----------------------------------------------------
app.post('/api/execute', async (req: Request, res: Response) => {
  try {
    const { code, language, stdin } = req.body as ExecutionRequest;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Valid "code" string is required to run.' });
    }

    if (!language) {
      return res.status(400).json({ error: 'Target "language" is required.' });
    }

    const executionResult = await runnerService.execute({ code, language, stdin });
    return res.json(executionResult);
  } catch (error: any) {
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
app.post('/api/settings/gemini-key', (req: Request, res: Response) => {
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
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to set Gemini API key' });
  }
});

// ----------------------------------------------------
// 6. ANALYSIS HISTORY ENDPOINTS
// ----------------------------------------------------
app.get('/api/history', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const analyses = db.getAnalyses(req.userId);
    return res.json(analyses);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch history' });
  }
});

app.get('/api/history/:id', (req: Request, res: Response) => {
  const analysis = db.getAnalysisById(req.params.id);
  if (!analysis) {
    return res.status(404).json({ error: 'Analysis record not found' });
  }
  return res.json(analysis);
});

app.delete('/api/history/:id', (req: Request, res: Response) => {
  const deleted = db.deleteAnalysis(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Analysis record not found' });
  }
  return res.json({ success: true, message: 'Analysis deleted successfully' });
});

// ----------------------------------------------------
// 7. GITHUB INTEGRATION ENDPOINTS
// ----------------------------------------------------
app.get('/api/github/repos', async (req: Request, res: Response) => {
  try {
    const username = (req.query.username as string) || 'supre';
    const token = req.query.token as string | undefined;
    const repos = await githubService.getUserRepos(username, token);
    return res.json(repos);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch GitHub repositories' });
  }
});

app.get('/api/github/contents', async (req: Request, res: Response) => {
  try {
    const owner = req.query.owner as string;
    const repo = req.query.repo as string;
    const path = (req.query.path as string) || '';
    const token = req.query.token as string | undefined;

    if (!owner || !repo) {
      return res.status(400).json({ error: 'Owner and repo query parameters are required.' });
    }

    const contents = await githubService.getRepoContents(owner, repo, path, token);
    return res.json(contents);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch repository contents' });
  }
});

app.post('/api/github/raw', async (req: Request, res: Response) => {
  try {
    const { downloadUrl, token } = req.body;
    if (!downloadUrl) {
      return res.status(400).json({ error: 'downloadUrl is required' });
    }

    const content = await githubService.getRawFileContent(downloadUrl, token);
    return res.json({ content });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch raw file content' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 DevLens API Server is listening on http://localhost:${PORT}`);
});
