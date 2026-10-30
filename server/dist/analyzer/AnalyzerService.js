"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyzerService = void 0;
const RuleRegistry_1 = require("./RuleRegistry");
const ComplexityEngine_1 = require("./complexity/ComplexityEngine");
const MetricsEngine_1 = require("./metrics/MetricsEngine");
const aiService_1 = require("../services/aiService");
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
            id: (0, uuid_1.v4)(),
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
exports.AnalyzerService = AnalyzerService;
