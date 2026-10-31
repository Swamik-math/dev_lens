"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyzerService = void 0;
const RuleRegistry_1 = require("./RuleRegistry");
const ComplexityEngine_1 = require("./complexity/ComplexityEngine");
const MetricsEngine_1 = require("./metrics/MetricsEngine");
const aiService_1 = require("../services/aiService");
const geminiService_1 = require("../services/geminiService");
const uuid_1 = require("uuid");
class AnalyzerService {
    ruleRegistry;
    complexityEngine;
    metricsEngine;
    aiService;
    constructor() {
        this.ruleRegistry = new RuleRegistry_1.RuleRegistry();
        this.complexityEngine = new ComplexityEngine_1.ComplexityEngine();
        this.metricsEngine = new MetricsEngine_1.MetricsEngine();
        this.aiService = new aiService_1.AiService();
    }
    async analyze(request) {
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
        let analysisSource = 'static-engine';
        if (activeGeminiKey && includeAi) {
            try {
                const geminiResult = await geminiService_1.geminiService.analyzeWithGemini(code, language, metrics, complexity, findings, activeGeminiKey);
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
                    const mappedFindings = geminiResult.additionalFindings.map(af => ({
                        id: (0, uuid_1.v4)(),
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
            }
            catch (err) {
                console.warn('Gemini API call failed, falling back to deterministic AST & heuristic engine:', err);
            }
        }
        // 5. Fallback to heuristic cognitive review if Gemini was not used or failed
        if (!aiReview && includeAi) {
            aiReview = await this.aiService.generateReview(code, language, metrics, complexity, findings);
        }
        return {
            id: (0, uuid_1.v4)(),
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
exports.AnalyzerService = AnalyzerService;
