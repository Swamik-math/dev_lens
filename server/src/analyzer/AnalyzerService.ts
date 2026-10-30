import { AnalysisRequest, AnalysisResult } from '../shared/types';
import { RuleRegistry } from './RuleRegistry';
import { ComplexityEngine } from './complexity/ComplexityEngine';
import { MetricsEngine } from './metrics/MetricsEngine';
import { AiService } from '../services/aiService';
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
    const { code, language, includeAi = true } = request;
    const lines = code.split('\n');

    // 1. Static code analysis rules
    const context = { code, language, lines };
    const findings = this.ruleRegistry.executeAll(context);

    // 2. Complexity Analysis (DSA Big-O)
    const complexity = this.complexityEngine.analyze(code, language);

    // 3. Code Metrics & Maintainability
    const metrics = this.metricsEngine.calculate(code, language);

    // 4. AI Cognitive Review & Suggestions
    let aiReview = undefined;
    if (includeAi) {
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
      aiReview
    };
  }
}
