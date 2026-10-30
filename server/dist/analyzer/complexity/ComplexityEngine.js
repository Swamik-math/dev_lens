"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplexityEngine = void 0;
class ComplexityEngine {
    analyze(code, language) {
        const lines = code.split('\n');
        const loopDetails = [];
        // 1. Check for single-line nested loops first (e.g., for (...) { for (...) { ... } })
        const singleLineLoops = this.detectSingleLineLoops(code, language);
        loopDetails.push(...singleLineLoops);
        // 2. Multi-line block loop detection if no single-line loops found or in addition
        if (loopDetails.length === 0) {
            const multiLineLoops = this.detectMultiLineLoops(lines, language);
            loopDetails.push(...multiLineLoops);
        }
        // 3. Recursion Analysis
        const recursionDetails = this.detectRecursion(code, lines, language);
        // 4. Auxiliary Space Analysis
        const spaceResult = this.detectSpaceComplexity(code, lines, language, recursionDetails);
        // 5. Compute overall Time Complexity and Explanations
        return this.synthesizeComplexity(loopDetails, recursionDetails, spaceResult);
    }
    detectSingleLineLoops(code, language) {
        const details = [];
        // Match chained for/while constructs on same line or collapsed code
        // e.g., for(...) ... for(...)
        const forPattern = /\bfor\s*\([^;]+;[^;]+;[^)]+\)/g;
        const matches = code.match(forPattern);
        if (matches && matches.length >= 2) {
            // Multiple loops in single line or compact format
            matches.forEach((match, idx) => {
                const isLogStep = /\*=|<<=|\/=|>>=/.test(match);
                const isConstant = /<=\s*\d+|i\s*<\s*\d+/.test(match);
                const step = isLogStep ? 'O(log n)' : isConstant ? 'O(1)' : 'O(n)';
                details.push({
                    depth: idx + 1,
                    line: 1,
                    type: 'for',
                    iteratorStep: match,
                    complexityContribution: step,
                    description: `Loop level ${idx + 1}: Iterates with complexity ${step}`
                });
            });
        }
        return details;
    }
    detectMultiLineLoops(lines, language) {
        const details = [];
        let currentDepth = 0;
        const depthStack = [];
        lines.forEach((line, index) => {
            const trimmed = line.trim();
            const lineNum = index + 1;
            // Detect loop headers
            let isLoop = false;
            let loopType = 'for';
            let stepComplexity = 'O(n)';
            if (['javascript', 'typescript', 'cpp', 'java'].includes(language)) {
                if (/^\s*for\s*\(/.test(line)) {
                    isLoop = true;
                    loopType = 'for';
                    if (/\*=|<<=|\/=|>>=/.test(line)) {
                        stepComplexity = 'O(log n)';
                    }
                    else if (/;\s*\w+\s*<\s*\d+\s*;/.test(line)) {
                        stepComplexity = 'O(1)';
                    }
                }
                else if (/^\s*while\s*\(/.test(line)) {
                    isLoop = true;
                    loopType = 'while';
                }
                else if (/^\s*do\s*\{/.test(line)) {
                    isLoop = true;
                    loopType = 'do-while';
                }
            }
            else if (language === 'python') {
                if (/^\s*for\s+\w+\s+in\s+/.test(line)) {
                    isLoop = true;
                    loopType = 'for';
                    if (/range\(.*,\s*.*,\s*2\s*\)/.test(line)) {
                        stepComplexity = 'O(n)';
                    }
                }
                else if (/^\s*while\s+/.test(line)) {
                    isLoop = true;
                    loopType = 'while';
                }
            }
            if (isLoop) {
                currentDepth++;
                depthStack.push({ type: loopType, line: lineNum });
                details.push({
                    depth: currentDepth,
                    line: lineNum,
                    type: loopType,
                    iteratorStep: trimmed.slice(0, 45) + (trimmed.length > 45 ? '...' : ''),
                    complexityContribution: stepComplexity,
                    description: currentDepth > 1
                        ? `Nested loop at depth ${currentDepth}: Multiplies outer complexity by ${stepComplexity}`
                        : `Top-level loop at depth 1: Contributes ${stepComplexity}`
                });
            }
            // Track block exits
            const closeBraces = (line.match(/\}/g) || []).length;
            const openBraces = (line.match(/\{/g) || []).length;
            if (closeBraces > openBraces && currentDepth > 0) {
                currentDepth = Math.max(0, currentDepth - (closeBraces - openBraces));
            }
        });
        return details;
    }
    detectRecursion(code, lines, language) {
        // Look for function definition followed by calls to its own name
        const funcMatch = code.match(/(?:function\s+([a-zA-Z0-9_]+)|(?:int|void|auto|float|double|bool|def|const)\s+([a-zA-Z0-9_]+)\s*\([^)]*\))/);
        if (funcMatch) {
            const funcName = funcMatch[1] || funcMatch[2];
            if (funcName && !['main', 'if', 'for', 'while', 'switch'].includes(funcName)) {
                const callRegex = new RegExp(`\\b${funcName}\\s*\\(`, 'g');
                const calls = code.match(callRegex);
                // If called more than once inside its own definition body, likely recursive
                if (calls && calls.length > 1) {
                    const recursiveCallsCount = calls.length - 1; // subtract the signature definition
                    const hasBaseCase = /if\s*\(.*return|if\s+.*:\s*return/.test(code);
                    const isBranching = recursiveCallsCount >= 2;
                    return {
                        hasRecursion: true,
                        functionName: funcName,
                        baseCaseDetected: hasBaseCase,
                        branchingFactor: recursiveCallsCount,
                        estimatedComplexity: isBranching ? 'O(2^n)' : 'O(n)',
                        description: isBranching
                            ? `Multiple recursive calls detected to '${funcName}' per invocation. Exponential branching pattern leads to O(2^n) time complexity.`
                            : `Single recursive call detected to '${funcName}'. Linear call chain leads to O(n) time and stack space.`
                    };
                }
            }
        }
        return {
            hasRecursion: false,
            baseCaseDetected: true
        };
    }
    detectSpaceComplexity(code, lines, language, recursion) {
        // Check dynamic data structure creations
        const hasDynamicAlloc = /new\s+(?:int|double|char|string|Array|vector|ArrayList|HashMap|HashSet)\[/i.test(code) ||
            /\bvector\s*<|\bmap\s*<|\bset\s*<|\bunordered_map\s*</i.test(code) ||
            /\[\s*\]|\{\s*\}|\bnew\s+Array\s*\(/.test(code) ||
            /\.append\(|\.push\(|\.insert\(/.test(code);
        if (recursion.hasRecursion) {
            const stackSpace = recursion.estimatedComplexity === 'O(2^n)' ? 'O(n)' : 'O(n)';
            return {
                space: stackSpace,
                explanation: `Space complexity is ${stackSpace} due to recursion call stack depth (holding up to n stack frames).`
            };
        }
        if (hasDynamicAlloc && /for\s*\(|while\s*\(/.test(code)) {
            return {
                space: 'O(n)',
                explanation: 'Space complexity is O(n) because memory allocations or collections grow proportionally with the input size.'
            };
        }
        return {
            space: 'O(1)',
            explanation: 'Space complexity is O(1) (constant) auxiliary memory: only primitive scalar variables and fixed storage are allocated.'
        };
    }
    synthesizeComplexity(loopDetails, recursionDetails, spaceResult) {
        // 1. If recursive
        if (recursionDetails.hasRecursion) {
            const time = recursionDetails.estimatedComplexity || 'O(n)';
            const score = time === 'O(2^n)' ? 30 : 65;
            return {
                timeComplexity: time,
                spaceComplexity: spaceResult.space,
                explanation: `${recursionDetails.description} ${spaceResult.explanation}`,
                score,
                loopDetails,
                recursionDetails
            };
        }
        // 2. Loop-based complexity
        const maxDepth = loopDetails.reduce((max, loop) => Math.max(max, loop.depth), 0);
        let timeComplexity = 'O(1)';
        let score = 95;
        let explanation = 'No significant iterations or loops detected. Statements execute in constant O(1) time.';
        if (maxDepth === 1) {
            const hasLog = loopDetails.some(l => l.complexityContribution === 'O(log n)');
            if (hasLog) {
                timeComplexity = 'O(log n)';
                score = 90;
                explanation = 'Single loop dividing or multiplying step counters exponentially, resulting in logarithmic O(log n) time complexity.';
            }
            else {
                timeComplexity = 'O(n)';
                score = 80;
                explanation = 'Single linear loop iterating through n elements. Total operations scale directly proportional to input size O(n).';
            }
        }
        else if (maxDepth === 2) {
            timeComplexity = 'O(n^2)';
            score = 55;
            explanation = 'Quadratic complexity O(n²): 2 levels of nested loops. The outer loop runs n times and for each iteration, the inner loop executes n times, totaling n × n = n² operations.';
        }
        else if (maxDepth === 3) {
            timeComplexity = 'O(n^3)';
            score = 40;
            explanation = 'Cubic complexity O(n³): 3 levels of nested loops. As input size n increases, execution time grows by n³. Consider refactoring with hash maps or prefix arrays.';
        }
        else if (maxDepth > 3) {
            timeComplexity = `O(n^${maxDepth})`;
            score = 25;
            explanation = `Polynomial complexity O(n^${maxDepth}): ${maxDepth} nested loops detected. This leads to prohibitive performance bottlenecks on non-trivial datasets.`;
        }
        return {
            timeComplexity,
            spaceComplexity: spaceResult.space,
            explanation: `${explanation} ${spaceResult.explanation}`,
            score,
            loopDetails,
            recursionDetails
        };
    }
}
exports.ComplexityEngine = ComplexityEngine;
