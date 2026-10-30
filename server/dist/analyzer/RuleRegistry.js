"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleRegistry = void 0;
const TodoFixmeRule_1 = require("./rules/TodoFixmeRule");
const DebugLogRule_1 = require("./rules/DebugLogRule");
const UnsafePatternsRule_1 = require("./rules/UnsafePatternsRule");
const EmptyBlockRule_1 = require("./rules/EmptyBlockRule");
const HardcodedSecretRule_1 = require("./rules/HardcodedSecretRule");
const DeepNestingRule_1 = require("./rules/DeepNestingRule");
class RuleRegistry {
    rules = [];
    constructor() {
        this.registerDefaultRules();
    }
    registerDefaultRules() {
        this.registerRule(new TodoFixmeRule_1.TodoFixmeRule());
        this.registerRule(new DebugLogRule_1.DebugLogRule());
        this.registerRule(new UnsafePatternsRule_1.UnsafePatternsRule());
        this.registerRule(new EmptyBlockRule_1.EmptyBlockRule());
        this.registerRule(new HardcodedSecretRule_1.HardcodedSecretRule());
        this.registerRule(new DeepNestingRule_1.DeepNestingRule());
    }
    registerRule(rule) {
        this.rules.push(rule);
    }
    executeAll(context) {
        const allFindings = [];
        for (const rule of this.rules) {
            try {
                const findings = rule.check(context);
                allFindings.push(...findings);
            }
            catch (err) {
                console.error(`Error running rule ${rule.id}:`, err);
            }
        }
        // Sort findings by line number
        return allFindings.sort((a, b) => a.line - b.line);
    }
}
exports.RuleRegistry = RuleRegistry;
