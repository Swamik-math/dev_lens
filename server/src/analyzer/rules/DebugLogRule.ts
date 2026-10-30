import { Rule, AnalysisContext } from '../types';
import { Finding } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export class DebugLogRule implements Rule {
  id = 'RULE_DEBUG_LOGS';
  name = 'Production Debug Output';
  description = 'Detects leftover console statements and debug logs that impact performance or leak sensitive data.';
  category = 'code-quality' as const;
  severity = 'warning' as const;

  check(context: AnalysisContext): Finding[] {
    const findings: Finding[] = [];
    const { language, lines } = context;

    lines.forEach((line, index) => {
      let matched = false;
      let logType = '';

      if (['javascript', 'typescript'].includes(language)) {
        if (/console\.(log|debug|info|dir|trace)\s*\(/.test(line)) {
          matched = true;
          logType = 'console.log/debug';
        }
      } else if (language === 'python') {
        if (/(^|[^\w])print\s*\(/.test(line)) {
          matched = true;
          logType = 'print() statement';
        }
      } else if (language === 'cpp') {
        if (/\b(std::)?cout\s*<<|\bprintf\s*\(/.test(line)) {
          matched = true;
          logType = 'cout / printf';
        }
      } else if (language === 'java') {
        if (/System\.(out|err)\.print(ln)?\s*\(/.test(line)) {
          matched = true;
          logType = 'System.out.println';
        }
      }

      if (matched) {
        findings.push({
          id: uuidv4(),
          ruleId: this.id,
          category: this.category,
          severity: this.severity,
          message: `Leftover debug logging statement detected (${logType})`,
          explanation: `Debug logging in hot code paths causes I/O bottlenecks and risks leaking sensitive internal state or customer information into unmonitored logs.`,
          line: index + 1,
          snippet: line.trim(),
          suggestion: `Remove this debug statement or replace it with a structured, configurable logging framework with log levels (e.g., logger.debug).`
        });
      }
    });

    return findings;
  }
}
