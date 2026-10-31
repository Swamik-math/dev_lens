import { 
  CodeMetrics, 
  ComplexityResult, 
  Finding, 
  SupportedLanguage, 
  OptimizationSuggestion, 
  SecurityRisk 
} from '../shared/types';

export interface GeminiAnalysisResponse {
  timeComplexity: string;
  spaceComplexity: string;
  score: number;
  complexityExplanation: string;
  summary: string;
  overallRating: 'Excellent' | 'Good' | 'Needs Improvement' | 'Critical Issues';
  optimizations: OptimizationSuggestion[];
  securityRisks: SecurityRisk[];
  additionalFindings?: Array<{
    ruleId: string;
    category: 'complexity' | 'security' | 'code-quality' | 'bug-risk' | 'maintainability';
    severity: 'critical' | 'warning' | 'info';
    message: string;
    explanation: string;
    line: number;
    suggestion?: string;
  }>;
}

export class GeminiService {
  public async analyzeWithGemini(
    code: string,
    language: SupportedLanguage,
    metrics: CodeMetrics,
    deterministicComplexity: ComplexityResult,
    findings: Finding[],
    apiKey: string
  ): Promise<GeminiAnalysisResponse> {
    const prompt = `You are DevLens's elite AI Algorithm & Code Analysis Engine.
You must perform an authoritative, mathematically rigorous analysis of the submitted ${language} code.

Code to analyze:
\`\`\`${language}
${code}
\`\`\`

Deterministic preliminary AST metrics already gathered:
- Total Lines: ${metrics.totalLines}
- Cyclomatic Complexity: ${metrics.cyclomaticComplexity}
- Initial Detected Patterns: ${deterministicComplexity.timeComplexity}
- Static checks: ${findings.length > 0 ? findings.map(f => f.message).join('; ') : 'None'}

Your mission:
1. Determine the EXACT asymptotic Time Complexity (Big-O) with highest precision (e.g., O(1), O(log n), O(n), O(n log n), O(n^2), O(N + Q log² N), O(V + E), O(2^n)).
2. Determine the EXACT Auxiliary Space Complexity (Big-O) taking into account auxiliary heap allocations, vectors, and recursive call stack frames (e.g. O(1), O(n), O(N + Q)).
3. Provide a clear, thorough explanation of the algorithmic mechanics, loops, recursion, and data structures.
4. Provide high-impact optimizations with precise beforeSnippet and afterSnippet refactorings.
5. Identify any potential security vulnerabilities, logic defects, memory leaks, or buffer overflows.

Respond ONLY with a valid JSON object matching this exact schema:
{
  "timeComplexity": "O(...)",
  "spaceComplexity": "O(...)",
  "score": number between 0 and 100,
  "complexityExplanation": "detailed explanation...",
  "summary": "concise executive summary...",
  "overallRating": "Excellent" | "Good" | "Needs Improvement" | "Critical Issues",
  "optimizations": [
    {
      "title": "string",
      "impact": "high" | "medium" | "low",
      "description": "string",
      "beforeSnippet": "code snippet",
      "afterSnippet": "optimized code snippet"
    }
  ],
  "securityRisks": [
    {
      "name": "string",
      "severity": "critical" | "warning" | "info",
      "cwe": "CWE-...",
      "description": "string",
      "mitigation": "string"
    }
  ],
  "additionalFindings": [
    {
      "ruleId": "RULE_GEMINI_DEFECT",
      "category": "complexity" | "security" | "code-quality" | "bug-risk" | "maintainability",
      "severity": "critical" | "warning" | "info",
      "message": "string",
      "explanation": "string",
      "line": 1,
      "suggestion": "string"
    }
  ]
}`;

    // Try gemini-2.5-flash first, fallback to gemini-1.5-flash
    const models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
    let lastError: any = null;

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json'
            }
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Gemini API HTTP ${response.status} (${model}): ${errText}`);
        }

        const data: any = await response.json();
        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!candidate) {
          throw new Error('Gemini API returned empty candidate content');
        }

        const parsed = JSON.parse(candidate);
        return {
          timeComplexity: parsed.timeComplexity || deterministicComplexity.timeComplexity,
          spaceComplexity: parsed.spaceComplexity || deterministicComplexity.spaceComplexity,
          score: typeof parsed.score === 'number' ? parsed.score : 85,
          complexityExplanation: parsed.complexityExplanation || deterministicComplexity.explanation,
          summary: parsed.summary || 'Gemini AI evaluated algorithmic complexity and code hygiene.',
          overallRating: parsed.overallRating || 'Good',
          optimizations: Array.isArray(parsed.optimizations) ? parsed.optimizations : [],
          securityRisks: Array.isArray(parsed.securityRisks) ? parsed.securityRisks : [],
          additionalFindings: Array.isArray(parsed.additionalFindings) ? parsed.additionalFindings : []
        };
      } catch (err: any) {
        lastError = err;
        // Continue to next model if model not found or rate limited
      }
    }

    throw lastError || new Error('All Gemini API models failed to process the request.');
  }
}

export const geminiService = new GeminiService();
