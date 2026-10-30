import { CodeMetrics, SupportedLanguage } from '../../shared/types';

export class MetricsEngine {
  public calculate(code: string, language: SupportedLanguage): CodeMetrics {
    const rawLines = code.split('\n');
    const totalLines = rawLines.length;

    let blankLines = 0;
    let commentLines = 0;
    let codeLines = 0;
    let inBlockComment = false;

    rawLines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) {
        blankLines++;
        return;
      }

      // Check comments
      if (inBlockComment) {
        commentLines++;
        if (trimmed.includes('*/') || (language === 'python' && trimmed.includes('"""'))) {
          inBlockComment = false;
        }
        return;
      }

      if (trimmed.startsWith('/*') || (language === 'python' && trimmed.startsWith('"""'))) {
        inBlockComment = true;
        commentLines++;
        return;
      }

      if (trimmed.startsWith('//') || trimmed.startsWith('#')) {
        commentLines++;
        return;
      }

      codeLines++;
    });

    // Calculate Cyclomatic Complexity (McCabe metric)
    // Counts decision branching: if, for, while, switch cases, catch, ternary, logical and/or
    const cyclomaticComplexity = this.calculateCyclomaticComplexity(code);

    // Maintainability Index (SEI formula normalized 0-100)
    // MI = Math.max(0, (171 - 5.2 * ln(Halstead) - 0.23 * Cyclomatic - 16.2 * ln(LOC)) * 100 / 171)
    const loc = Math.max(1, codeLines);
    const rawMI = 171 - (0.23 * cyclomaticComplexity) - (16.2 * Math.log(loc));
    const maintainabilityIndex = Math.min(100, Math.max(0, Math.round((rawMI / 171) * 100)));

    return {
      totalLines,
      codeLines,
      commentLines,
      blankLines,
      cyclomaticComplexity,
      maintainabilityIndex
    };
  }

  private calculateCyclomaticComplexity(code: string): number {
    let complexity = 1; // Base path

    const branchingPatterns = [
      /\bif\b/g,
      /\belse\s+if\b/g,
      /\bfor\b/g,
      /\bwhile\b/g,
      /\bcase\b/g,
      /\bcatch\b/g,
      /&&/g,
      /\|\|/g,
      /\?/g
    ];

    for (const pattern of branchingPatterns) {
      const matches = code.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }
}
