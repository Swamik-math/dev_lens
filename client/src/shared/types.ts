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
  timeComplexity: string; // e.g. "O(n^2)", "O(n log n)", "O(1)", "O(N + Q log² N)"
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
  analysisSource?: 'gemini' | 'static-engine';
}

export interface AnalysisRequest {
  code: string;
  language: SupportedLanguage;
  includeAi?: boolean;
  geminiApiKey?: string;
}

// Code Execution Interfaces
export interface ExecutionRequest {
  code: string;
  language: SupportedLanguage;
  stdin?: string;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  status: 'success' | 'error' | 'timeout';
}

// User & Auth
export interface User {
  id: string;
  name: string;
  email: string;
  githubUsername?: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Saved Analysis Report
export interface SavedAnalysis {
  id: string;
  userId?: string;
  name: string;
  code: string;
  language: SupportedLanguage;
  result: AnalysisResult;
  createdAt: string;
}

// Dashboard Aggregates
export interface DashboardStats {
  totalScans: number;
  projectHealth: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  totalLoc: number;
  totalFindings: {
    critical: number;
    warning: number;
    info: number;
  };
  avgCyclomatic: number;
  avgMaintainability: number;
  complexityDistribution: Record<string, number>;
  recentScans: SavedAnalysis[];
}

// GitHub Integration
export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  language?: string;
  stars: number;
  default_branch: string;
  html_url: string;
  isPrivate?: boolean;
}

export interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  download_url?: string;
}

export interface GitHubUserProfile {
  login: string;
  name?: string;
  avatar_url: string;
  html_url: string;
  bio?: string;
  public_repos: number;
  total_private_repos?: number;
}
