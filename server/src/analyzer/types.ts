import { Finding, SupportedLanguage, CodeMetrics, ComplexityResult } from '../shared/types';

export interface AnalysisContext {
  code: string;
  language: SupportedLanguage;
  lines: string[];
  ast?: any;
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  category: 'complexity' | 'security' | 'code-quality' | 'bug-risk' | 'maintainability';
  severity: 'critical' | 'warning' | 'info';
  check(context: AnalysisContext): Finding[];
}
