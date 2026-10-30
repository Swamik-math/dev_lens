import { Rule, AnalysisContext } from '../types';
import { Finding } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export class HardcodedSecretRule implements Rule {
  id = 'RULE_HARDCODED_SECRETS';
  name = 'Hardcoded Secrets & API Keys';
  description = 'Detects suspicious high-entropy tokens, passwords, and private keys hardcoded in source files.';
  category = 'security' as const;
  severity = 'critical' as const;

  check(context: AnalysisContext): Finding[] {
    const findings: Finding[] = [];
    const secretPatterns = [
      { pattern: /(?:api_?key|apiKey|secret|password|access_?token)\s*[:=]\s*["']([A-Za-z0-9_\-]{16,})["']/i, type: 'API Key or Token' },
      { pattern: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/, type: 'Private Key Block' },
      { pattern: /ghp_[A-Za-z0-9]{36}/, type: 'GitHub Personal Access Token' },
      { pattern: /ey[A-Za-z0-9-_]{10,}\.[A-Za-z0-9-_]{10,}\.[A-Za-z0-9-_]{10,}/, type: 'JWT Token' },
      { pattern: /AIza[0-9A-Za-z-_]{35}/, type: 'Google API Key' }
    ];

    context.lines.forEach((line, index) => {
      for (const item of secretPatterns) {
        if (item.pattern.test(line)) {
          // Mask sensitive snippet
          const sanitizedSnippet = line.trim().replace(/["'][A-Za-z0-9_\-]{8,}["']/g, '"[REDACTED_SECRET]"');
          findings.push({
            id: uuidv4(),
            ruleId: this.id,
            category: 'security',
            severity: 'critical',
            message: `Suspected hardcoded credential found (${item.type})`,
            explanation: 'Hardcoding credentials in source code exposes secrets if the repository is shared, committed to version control, or compromised.',
            line: index + 1,
            snippet: sanitizedSnippet,
            suggestion: 'Store credentials in environment variables (.env) or a secret manager (e.g. AWS Secrets Manager, Vault).'
          });
          break;
        }
      }
    });

    return findings;
  }
}
