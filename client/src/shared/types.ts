export type SupportedLanguage = 'javascript' | 'typescript' | 'python' | 'cpp' | 'java';

export type FindingSeverity = 'critical' | 'warning' | 'info';

export type FindingCategory = 'complexity' | 'security' | 'code-quality' | 'bug-risk' | 'maintainability';

export interface CodePosition {
  line: number;
  column: number;
}

export interface Finding {
  id: string;
  ruleId: string;
  category: FindingCategory;
  severity: FindingSeverity;
  message: string;
  explanation: string;
  line: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
  snippet?: string;
  suggestion?: string;
}

export interface LoopDetail {
  depth: number;
  line: number;
  type: 'for' | 'while' | 'do-while' | 'for-in' | 'for-of' | 'nested';
  variable?: string;
  iteratorStep?: string;
  complexityContribution: string;
  description: string;
}

export interface RecursionDetail {
  hasRecursion: boolean;
  functionName?: string;
  line?: number;
  baseCaseDetected: boolean;
  branchingFactor?: number;
  estimatedComplexity?: string;
  description?: string;
}

export interface ComplexityResult {
  timeComplexity: string; // e.g. "O(n^2)", "O(n log n)", "O(1)"
  spaceComplexity: string; // e.g. "O(n)", "O(1)"
  explanation: string;
  score: number; // 0 to 100 performance score
  loopDetails: LoopDetail[];
  recursionDetails?: RecursionDetail;
}

export interface CodeMetrics {
  totalLines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
  cyclomaticComplexity: number;
  maintainabilityIndex: number;
}

export interface OptimizationSuggestion {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  beforeSnippet?: string;
  afterSnippet?: string;
}

export interface SecurityRisk {
  name: string;
  severity: FindingSeverity;
  cwe?: string;
  description: string;
  mitigation: string;
}

export interface AiReviewResult {
  summary: string;
  overallRating: 'Excellent' | 'Good' | 'Needs Improvement' | 'Critical Issues';
  optimizations: OptimizationSuggestion[];
  securityRisks: SecurityRisk[];
  refactoredCode?: string;
  explanation: string;
}

export interface AnalysisResult {
  id: string;
  timestamp: string;
  language: SupportedLanguage;
  code: string;
  metrics: CodeMetrics;
  complexity: ComplexityResult;
  findings: Finding[];
  aiReview?: AiReviewResult;
}

export interface AnalysisRequest {
  code: string;
  language: SupportedLanguage;
  includeAi?: boolean;
}
