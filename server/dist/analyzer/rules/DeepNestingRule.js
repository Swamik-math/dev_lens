"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeepNestingRule = void 0;
const uuid_1 = require("uuid");
class DeepNestingRule {
    id = 'RULE_DEEP_NESTING';
    name = 'Excessive Control Flow Nesting';
    description = 'Flags functions and blocks nested beyond 3 levels, causing high cognitive load and arrow anti-patterns.';
    category = 'maintainability';
    severity = 'warning';
    check(context) {
        const findings = [];
        let currentIndentLevel = 0;
        const maxAllowedDepth = 3;
        context.lines.forEach((line, index) => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*')) {
                return;
            }
            // Check indentation depth based on leading spaces (assume 2 or 4 spaces per indent)
            const leadingSpaces = line.search(/\S|$/);
            const calculatedDepth = Math.floor(leadingSpaces / 2); // normalize 2-4 spaces
            // Also count braces in C-like languages
            const openBraces = (line.match(/\{/g) || []).length;
            const closeBraces = (line.match(/\}/g) || []).length;
            currentIndentLevel += openBraces - closeBraces;
            const effectiveDepth = Math.max(calculatedDepth, currentIndentLevel);
            if (effectiveDepth > maxAllowedDepth && (trimmed.startsWith('if') || trimmed.startsWith('for') || trimmed.startsWith('while'))) {
                findings.push({
                    id: (0, uuid_1.v4)(),
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
exports.DeepNestingRule = DeepNestingRule;
