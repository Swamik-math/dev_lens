"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
class AiService {
    /**
     * Generates deep cognitive review combining deterministic AST/rule metrics
     * with contextual pedagogical explanations and refactoring suggestions.
     */
    async generateReview(code, language, metrics, complexity, findings) {
        // If external LLM API key (e.g. GEMINI_API_KEY) is configured in environment,
        // we can call it. Otherwise, we execute our robust internal heuristics synthesizer.
        const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
        if (apiKey) {
            try {
                return await this.callExternalLLM(code, language, metrics, complexity, findings, apiKey);
            }
            catch (err) {
                console.warn('External LLM call failed or timed out, falling back to heuristic AI engine:', err);
            }
        }
        return this.synthesizeHeuristicReview(code, language, metrics, complexity, findings);
    }
    synthesizeHeuristicReview(code, language, metrics, complexity, findings) {
        const optimizations = [];
        const securityRisks = [];
        // Map security findings
        const secFindings = findings.filter(f => f.category === 'security');
        secFindings.forEach(f => {
            securityRisks.push({
                name: f.message,
                severity: f.severity,
                cwe: f.ruleId === 'RULE_SECURITY_UNSAFE' ? 'CWE-94 / CWE-79' : 'CWE-798',
                description: f.explanation,
                mitigation: f.suggestion || 'Review and remove unsafe pattern.'
            });
        });
        // Complexity-driven optimization advice
        if (complexity.timeComplexity === 'O(n^2)' || complexity.timeComplexity === 'O(n^3)') {
            optimizations.push({
                title: `Mitigate Quadratic Bottleneck (${complexity.timeComplexity})`,
                impact: 'high',
                description: `Nested iterations over the same collection scale quadratically. Consider indexing elements into a Hash Map (O(1) lookup) or utilizing a Two-Pointer technique on pre-sorted arrays to achieve O(n) or O(n log n) efficiency.`,
                beforeSnippet: `// Nested loop detected:\nfor (let i = 0; i < n; i++) {\n  for (let j = 0; j < n; j++) { ... }\n}`,
                afterSnippet: `// Optimized hash set / map lookup:\nconst seen = new Set();\nfor (let i = 0; i < n; i++) {\n  if (seen.has(target - arr[i])) { ... }\n  seen.add(arr[i]);\n}`
            });
        }
        if (metrics.maintainabilityIndex < 60) {
            optimizations.push({
                title: 'Decompose Complex Methods into Single Responsibility Units',
                impact: 'medium',
                description: `Maintainability index is low (${metrics.maintainabilityIndex}/100) with cyclomatic complexity ${metrics.cyclomaticComplexity}. Break down monolithic functions into smaller, pure helpers to enhance unit testability.`,
            });
        }
        // Determine overall rating
        let overallRating = 'Good';
        if (secFindings.length > 0 || complexity.score < 50) {
            overallRating = secFindings.some(s => s.severity === 'critical') ? 'Critical Issues' : 'Needs Improvement';
        }
        else if (metrics.maintainabilityIndex >= 80 && complexity.score >= 80 && findings.length === 0) {
            overallRating = 'Excellent';
        }
        const summary = `DevLens Analysis: Code evaluates with ${complexity.timeComplexity} time complexity and ${complexity.spaceComplexity} auxiliary space. ${findings.length} issue(s) identified across static quality rules.`;
        const explanation = `DevLens identified that the current routine relies on ${complexity.loopDetails.length > 0 ? `${complexity.loopDetails.length} iteration level(s)` : 'sequential operations'}. ${complexity.explanation}`;
        return {
            summary,
            overallRating,
            optimizations,
            securityRisks,
            explanation
        };
    }
    async callExternalLLM(code, language, metrics, complexity, findings, apiKey) {
        // Scaffolded for pluggable LLM API
        return this.synthesizeHeuristicReview(code, language, metrics, complexity, findings);
    }
}
exports.AiService = AiService;
