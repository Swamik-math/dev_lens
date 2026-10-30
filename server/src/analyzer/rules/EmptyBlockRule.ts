import { Rule, AnalysisContext } from '../types';
import { Finding } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export class EmptyBlockRule implements Rule {
  id = 'RULE_EMPTY_BLOCK';
  name = 'Swallowed Errors & Empty Exception Handlers';
  description = 'Detects empty catch/except blocks that swallow errors silently, making bugs impossible to trace.';
  category = 'bug-risk' as const;
  severity = 'warning' as const;

  check(context: AnalysisContext): Finding[] {
    const findings: Finding[] = [];
    const { language, lines } = context;

    lines.forEach((line, index) => {
      // JS / TS / Java / C++ catch with empty block
      if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(line)) {
        findings.push({
          id: uuidv4(),
          ruleId: this.id,
          category: 'bug-risk',
          severity: 'warning',
          message: 'Empty catch block silently swallowing exceptions',
          explanation: 'Ignoring caught exceptions hides underlying faults, race conditions, or network failures, leaving the system in an unknown state.',
          line: index + 1,
          snippet: line.trim(),
          suggestion: 'Log the error or re-throw it with contextual information.'
        });
      }

      // Python except: pass
      if (language === 'python' && /except(\s+\w+)?:\s*pass\b/.test(line)) {
        findings.push({
          id: uuidv4(),
          ruleId: this.id,
          category: 'bug-risk',
          severity: 'warning',
          message: 'Silent exception swallowing with except: pass',
          explanation: 'Catching and suppressing exceptions with "pass" blinds the developer to critical application errors.',
          line: index + 1,
          snippet: line.trim(),
          suggestion: 'Handle the specific exception or log it with logger.exception().'
        });
      }
    });

    return findings;
  }
}
