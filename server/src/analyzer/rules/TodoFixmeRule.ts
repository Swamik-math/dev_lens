import { Rule, AnalysisContext } from '../types';
import { Finding } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export class TodoFixmeRule implements Rule {
  id = 'RULE_TODO_FIXME';
  name = 'Technical Debt & Action Item Markers';
  description = 'Detects unresolved TODO, FIXME, HACK, or XXX markers in the code.';
  category = 'maintainability' as const;
  severity = 'info' as const;

  check(context: AnalysisContext): Finding[] {
    const findings: Finding[] = [];
    const pattern = /\b(TODO|FIXME|HACK|XXX|BUG|OPTIMIZE)\b(?::|\s+)(.*)$/i;

    context.lines.forEach((line, index) => {
      const match = line.match(pattern);
      if (match) {
        const marker = match[1].toUpperCase();
        const details = match[2].trim() || 'No description provided';
        const isFixme = marker === 'FIXME' || marker === 'BUG';

        findings.push({
          id: uuidv4(),
          ruleId: this.id,
          category: this.category,
          severity: isFixme ? 'warning' : 'info',
          message: `Unresolved ${marker}: "${details}"`,
          explanation: `Markers like ${marker} indicate unfinished work or acknowledged technical debt. Track this in your issue management system before merging.`,
          line: index + 1,
          snippet: line.trim(),
          suggestion: `Address or ticket this ${marker} item before deploying to production.`
        });
      }
    });

    return findings;
  }
}
