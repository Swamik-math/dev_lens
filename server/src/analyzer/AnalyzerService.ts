import { AnalysisRequest, AnalysisResult, Finding } from '../shared/types';
import { RuleRegistry } from './RuleRegistry';
import { ComplexityEngine } from './complexity/ComplexityEngine';
import { MetricsEngine } from './metrics/MetricsEngine';
import { AiService } from '../services/aiService';
import { geminiService } from '../services/geminiService';
import { v4 as uuidv4 } from 'uuid';

export class AnalyzerService {
  private ruleRegistry: RuleRegistry;
  private complexityEngine: ComplexityEngine;
  private metricsEngine: MetricsEngine;
  private aiService: AiService;

  constructor() {
    this.ruleRegistry = new RuleRegistry();
    this.complexityEngine = new ComplexityEngine();
    this.metricsEngine = new MetricsEngine();
    this.aiService = new AiService();
  }

  public async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
    const { code, language, includeAi = true, geminiApiKey } = request;
    const lines = code.split('\n');

    // 1. Deterministic Static code analysis rules (Security, quality, secrets, smells)
    const context = { code, language, lines };
    let findings = this.ruleRegistry.executeAll(context);

    // 2. Deterministic Complexity Analysis (AST Loop Depth, Recursion, Dynamic Allocations)
    let complexity = this.complexityEngine.analyze(code, language);

    // 3. Code Metrics & Maintainability Index
    const metrics = this.metricsEngine.calculate(code, language);

    // 4. Check for Gemini API Key (from request or environment variable)
    const activeGeminiKey = geminiApiKey || process.env.GEMINI_API_KEY;
    let aiReview = undefined;
    let analysisSource: 'gemini' | 'static-engine' = 'static-engine';

    if (activeGeminiKey && includeAi) {
      try {
        const geminiResult = await geminiService.analyzeWithGemini(
          code,
          language,
          metrics,
          complexity,
          findings,
          activeGeminiKey
        );

        // Ground-truth asymptotic override from Gemini AI
        complexity = {
          ...complexity,
          timeComplexity: geminiResult.timeComplexity,
          spaceComplexity: geminiResult.spaceComplexity,
          explanation: geminiResult.complexityExplanation,
          score: geminiResult.score
        };

        // Merge any additional deep findings discovered by Gemini
        if (geminiResult.additionalFindings && geminiResult.additionalFindings.length > 0) {
          const mappedFindings: Finding[] = geminiResult.additionalFindings.map(af => ({
            id: uuidv4(),
            ruleId: af.ruleId || 'RULE_GEMINI_DEFECT',
            category: af.category || 'code-quality',
            severity: af.severity || 'warning',
            message: af.message,
            explanation: af.explanation,
            line: af.line || 1,
            suggestion: af.suggestion
          }));
          findings = [...findings, ...mappedFindings];
        }

        aiReview = {
          summary: geminiResult.summary,
          overallRating: geminiResult.overallRating,
          optimizations: geminiResult.optimizations,
          securityRisks: geminiResult.securityRisks,
          explanation: geminiResult.complexityExplanation
        };

        analysisSource = 'gemini';
      } catch (err) {
        console.warn('Gemini API call failed, falling back to deterministic AST & heuristic engine:', err);
      }
    }

    // 5. Fallback to heuristic cognitive review if Gemini was not used or failed
    if (!aiReview && includeAi) {
      aiReview = await this.aiService.generateReview(code, language, metrics, complexity, findings);
    }

    return {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      language,
      code,
      metrics,
      complexity,
      findings,
      aiReview,
      analysisSource
    };
  }
}
