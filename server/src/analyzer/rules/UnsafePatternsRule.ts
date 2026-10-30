import { Rule, AnalysisContext } from '../types';
import { Finding } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export class UnsafePatternsRule implements Rule {
  id = 'RULE_SECURITY_UNSAFE';
  name = 'Unsafe Dynamic Code Execution & Injection';
  description = 'Detects dangerous APIs and injection vectors like eval, innerHTML, system calls, and unsafe subprocess execution.';
  category = 'security' as const;
  severity = 'critical' as const;

  check(context: AnalysisContext): Finding[] {
    const findings: Finding[] = [];
    const { language, lines } = context;

    lines.forEach((line, index) => {
      // JS / TS
      if (['javascript', 'typescript'].includes(language)) {
        if (/\beval\s*\(/.test(line)) {
          findings.push({
            id: uuidv4(),
            ruleId: this.id,
            category: 'security',
            severity: 'critical',
            message: 'Direct invocation of `eval()` is hazardous',
            explanation: '`eval()` executes arbitrary strings as code in the caller privilege scope, enabling severe Remote Code Execution (RCE) and Cross-Site Scripting (XSS).',
            line: index + 1,
            snippet: line.trim(),
            suggestion: 'Parse structured JSON using JSON.parse() or refactor with deterministic logic without eval.'
          });
        }
        if (/\bnew\s+Function\s*\(/.test(line)) {
          findings.push({
            id: uuidv4(),
            ruleId: this.id,
            category: 'security',
            severity: 'critical',
            message: 'Dynamic Function constructor used',
            explanation: 'Similar to eval(), `new Function(...)` constructs executable code from strings, allowing arbitrary code execution if user input reaches it.',
            line: index + 1,
            snippet: line.trim(),
            suggestion: 'Use static functions or safe dispatch maps.'
          });
        }
        if (/\binnerHTML\s*=|dangerouslySetInnerHTML/.test(line)) {
          findings.push({
            id: uuidv4(),
            ruleId: this.id,
            category: 'security',
            severity: 'warning',
            message: 'Potential Cross-Site Scripting (XSS) via raw HTML injection',
            explanation: 'Assigning unescaped content to innerHTML enables script injection if any part of the string originates from user input or external APIs.',
            line: index + 1,
            snippet: line.trim(),
            suggestion: 'Use textContent, innerText, or sanitize with DOMPurify.'
          });
        }
      }

      // Python
      if (language === 'python') {
        if (/\b(eval|exec)\s*\(/.test(line)) {
          findings.push({
            id: uuidv4(),
            ruleId: this.id,
            category: 'security',
            severity: 'critical',
            message: 'Unsafe dynamic evaluation using eval/exec',
            explanation: '`eval` and `exec` in Python execute strings in the global/local namespace, which can lead to complete server compromise if untrusted input is supplied.',
            line: index + 1,
            snippet: line.trim(),
            suggestion: 'Use ast.literal_eval for safe literals or refactor to avoid dynamic evaluation.'
          });
        }
        if (/shell\s*=\s*True/.test(line)) {
          findings.push({
            id: uuidv4(),
            ruleId: this.id,
            category: 'security',
            severity: 'critical',
            message: 'Subprocess spawned with shell=True',
            explanation: 'Passing shell=True to subprocess functions opens the application to command injection attacks via shell metacharacters.',
            line: index + 1,
            snippet: line.trim(),
            suggestion: 'Pass command arguments as a list and set shell=False.'
          });
        }
      }

      // C++
      if (language === 'cpp') {
        if (/\bsystem\s*\(/.test(line)) {
          findings.push({
            id: uuidv4(),
            ruleId: this.id,
            category: 'security',
            severity: 'critical',
            message: 'Unsafe system() call detected',
            explanation: 'The system() function invokes the OS shell command processor and is susceptible to command injection if arguments are manipulated.',
            line: index + 1,
            snippet: line.trim(),
            suggestion: 'Use execve/posix_spawn with explicit sanitized argument vectors.'
          });
        }
        if (/\b(gets|strcpy|strcat|sprintf)\s*\(/.test(line)) {
          findings.push({
            id: uuidv4(),
            ruleId: this.id,
            category: 'security',
            severity: 'warning',
            message: 'Legacy buffer-overflow prone C string function detected',
            explanation: 'Functions like strcpy/sprintf perform unbounded memory copies that can cause buffer overflows.',
            line: index + 1,
            snippet: line.trim(),
            suggestion: 'Use bounded alternatives like snprintf, strncpy, or std::string.'
          });
        }
      }

      // Java
      if (language === 'java') {
        if (/Runtime\.getRuntime\(\)\.exec\(|ProcessBuilder/.test(line)) {
          findings.push({
            id: uuidv4(),
            ruleId: this.id,
            category: 'security',
            severity: 'warning',
            message: 'OS command execution detected via ProcessBuilder/Runtime',
            explanation: 'Ensure all parameters passed to process execution are strictly validated against allow-lists to prevent argument injection.',
            line: index + 1,
            snippet: line.trim(),
            suggestion: 'Validate and sanitize all process arguments.'
          });
        }
      }
    });

    return findings;
  }
}
