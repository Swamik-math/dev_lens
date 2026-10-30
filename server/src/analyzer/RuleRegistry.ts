import { Rule, AnalysisContext } from './types';
import { Finding } from '../shared/types';
import { TodoFixmeRule } from './rules/TodoFixmeRule';
import { DebugLogRule } from './rules/DebugLogRule';
import { UnsafePatternsRule } from './rules/UnsafePatternsRule';
import { EmptyBlockRule } from './rules/EmptyBlockRule';
import { HardcodedSecretRule } from './rules/HardcodedSecretRule';
import { DeepNestingRule } from './rules/DeepNestingRule';

export class RuleRegistry {
  private rules: Rule[] = [];

  constructor() {
    this.registerDefaultRules();
  }

  private registerDefaultRules(): void {
    this.registerRule(new TodoFixmeRule());
    this.registerRule(new DebugLogRule());
    this.registerRule(new UnsafePatternsRule());
    this.registerRule(new EmptyBlockRule());
    this.registerRule(new HardcodedSecretRule());
    this.registerRule(new DeepNestingRule());
  }

  public registerRule(rule: Rule): void {
    this.rules.push(rule);
  }

  public executeAll(context: AnalysisContext): Finding[] {
    const allFindings: Finding[] = [];
    for (const rule of this.rules) {
      try {
        const findings = rule.check(context);
        allFindings.push(...findings);
      } catch (err) {
        console.error(`Error running rule ${rule.id}:`, err);
      }
    }
    // Sort findings by line number
    return allFindings.sort((a, b) => a.line - b.line);
  }
}
