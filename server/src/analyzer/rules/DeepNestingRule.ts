import { Rule, AnalysisContext } from '../types';
import { Finding } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export class DeepNestingRule implements Rule {
  id = 'RULE_DEEP_NESTING';
  name = 'Excessive Control Flow Nesting';
  description = 'Flags functions and blocks nested beyond 3 levels, causing high cognitive load and arrow anti-patterns.';
  category = 'maintainability' as const;
  severity = 'warning' as const;

  check(context: AnalysisContext): Finding[] {
    const findings: Finding[] = [];
    let currentIndentLevel = 0;
    const maxAllowedDepth = 3;

    context.lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*')) {
        return;
      }

      // Check indentation depth based on 4 spaces per standard indent level
      const leadingSpaces = line.search(/\S|$/);
      const calculatedDepth = Math.floor(leadingSpaces / 4);

      // Track braces in C-like languages
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      currentIndentLevel += openBraces - closeBraces;

      const effectiveDepth = context.language === 'python' ? calculatedDepth : Math.max(1, currentIndentLevel);

      if (effectiveDepth > maxAllowedDepth && (trimmed.startsWith('if') || trimmed.startsWith('for') || trimmed.startsWith('while'))) {
        findings.push({
          id: uuidv4(),
          ruleId: this.id,
          category: 'maintainability',
          severity: 'warning',
          message: `Deeply nested control structure (level ${effectiveDepth})`,
          explanation: 'Excessive nesting creates the "Arrow Anti-pattern", making code difficult to read, reason about, and thoroughly test.',
          line: index + 1,
          snippet: trimmed,
          suggestion: 'Refactor using guard clauses (early returns) or extract inner logic into dedicated helper functions.'
        });
      }
    });

    return findings;
  }
}
