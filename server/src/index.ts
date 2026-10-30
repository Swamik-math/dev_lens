import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AnalyzerService } from './analyzer/AnalyzerService';
import { AnalysisRequest } from './shared/types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

const analyzerService = new AnalyzerService();

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'DevLens Analysis API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Code Analysis Endpoint
app.post('/api/analyze', async (req: Request, res: Response) => {
  try {
    const { code, language, includeAi } = req.body as AnalysisRequest;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Valid "code" string is required.' });
    }

    if (!language) {
      return res.status(400).json({ error: 'Target "language" is required.' });
    }

    const result = await analyzerService.analyze({ code, language, includeAi });
    return res.json(result);
  } catch (error: any) {
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
