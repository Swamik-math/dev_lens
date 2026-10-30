import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { User, SavedAnalysis, DashboardStats } from '../shared/types';

interface StoredUser extends User {
  passwordHash: string;
}

interface DatabaseSchema {
  users: StoredUser[];
  analyses: SavedAnalysis[];
}

export class Database {
  private dataDir: string;
  private dbPath: string;
  private data: DatabaseSchema;

  constructor() {
    this.dataDir = path.join(__dirname, '../../data');
    this.dbPath = path.join(this.dataDir, 'db.json');
    this.data = { users: [], analyses: [] };
    this.init();
  }

  private init() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    if (fs.existsSync(this.dbPath)) {
      try {
        const raw = fs.readFileSync(this.dbPath, 'utf-8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.error('Error reading db.json, reinitializing:', err);
        this.seedInitialData();
      }
    } else {
      this.seedInitialData();
    }
  }

  private persist() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write db.json:', err);
    }
  }

  private seedInitialData() {
    // Seed initial historical analyses matching the dashboard visuals
    const initialAnalyses: SavedAnalysis[] = [
      {
        id: uuidv4(),
        name: 'Matrix Multiplication Optimization',
        code: `for (int i = 0; i < n; i++) {\n  for (int j = 0; j < n; j++) {\n    cout << i + j;\n  }\n}`,
        language: 'cpp',
        createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
        result: {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          language: 'cpp',
          code: `for (int i = 0; i < n; i++) {\n  for (int j = 0; j < n; j++) {\n    cout << i + j;\n  }\n}`,
          metrics: {
            totalLines: 5,
            codeLines: 5,
            commentLines: 0,
            blankLines: 0,
            cyclomaticComplexity: 3,
            maintainabilityIndex: 82
          },
          complexity: {
            timeComplexity: 'O(n^2)',
            spaceComplexity: 'O(1)',
            score: 55,
            explanation: 'Quadratic complexity O(n²): 2 nested loops iterating over n.',
            loopDetails: [
              { depth: 1, line: 1, type: 'for', complexityContribution: 'O(n)', description: 'Top level loop' },
              { depth: 2, line: 2, type: 'for', complexityContribution: 'O(n)', description: 'Nested loop level 2' }
            ]
          },
          findings: [
            {
              id: uuidv4(),
              ruleId: 'RULE_DEBUG_LOGS',
              category: 'code-quality',
              severity: 'warning',
              message: 'Leftover debug logging statement detected (cout)',
              explanation: 'Avoid streaming to std::cout in hot loops.',
              line: 3,
              snippet: 'cout << i + j;',
              suggestion: 'Buffer output or log via structured logger.'
            }
          ],
          aiReview: {
            summary: 'Quadratic computation routine detected with minor I/O latency smell.',
            overallRating: 'Good',
            optimizations: [
              {
                title: 'Vectorize inner loop with SIMD',
                description: 'Pre-allocate output array and utilize compiler vectorization.',
                impact: 'high'
              }
            ],
            securityRisks: [],
            explanation: 'Dual level iterations require O(n²) operations.'
          }
        }
      },
      {
        id: uuidv4(),
        name: 'Authentication Dispatcher Service',
        code: `function verify(token) {\n  console.log("Token:", token);\n  // TODO: Add revocation check\n  try {\n    eval(token);\n  } catch(e) {}\n}`,
        language: 'javascript',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        result: {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          language: 'javascript',
          code: `function verify(token) {\n  console.log("Token:", token);\n  // TODO: Add revocation check\n  try {\n    eval(token);\n  } catch(e) {}\n}`,
          metrics: {
            totalLines: 7,
            codeLines: 6,
            commentLines: 1,
            blankLines: 0,
            cyclomaticComplexity: 2,
            maintainabilityIndex: 68
          },
          complexity: {
            timeComplexity: 'O(1)',
            spaceComplexity: 'O(1)',
            score: 95,
            explanation: 'Linear control flow executing in constant time.',
            loopDetails: []
          },
          findings: [
            {
              id: uuidv4(),
              ruleId: 'RULE_SECURITY_UNSAFE',
              category: 'security',
              severity: 'critical',
              message: 'Direct invocation of `eval()` is hazardous',
              explanation: '`eval()` executes untrusted strings as code in the application privilege context.',
              line: 5,
              snippet: 'eval(token);',
              suggestion: 'Use jsonwebtoken library to verify signature without eval.'
            },
            {
              id: uuidv4(),
              ruleId: 'RULE_EMPTY_BLOCK',
              category: 'bug-risk',
              severity: 'warning',
              message: 'Empty catch block silently swallowing exceptions',
              explanation: 'Exceptions during token parsing are lost without trace.',
              line: 6,
              snippet: '} catch(e) {}',
              suggestion: 'Log the error or reject the promise.'
            }
          ],
          aiReview: {
            summary: 'Critical security vulnerability: dangerous eval statement discovered in auth path.',
            overallRating: 'Critical Issues',
            optimizations: [],
            securityRisks: [
              {
                name: 'Arbitrary Code Execution via eval()',
                severity: 'critical',
                cwe: 'CWE-94',
                description: 'User-provided token parameter is evaluated directly.',
                mitigation: 'Remove eval and use standard cryptographic verification.'
              }
            ],
            explanation: 'Code exposes extreme security liabilities while having minimal algorithmic complexity.'
          }
        }
      }
    ];

    this.data.analyses = initialAnalyses;
    this.persist();
  }

  // User methods
  public createUser(name: string, email: string, passwordHash: string): User {
    const user: StoredUser = {
      id: uuidv4(),
      name,
      email,
      passwordHash,
      createdAt: new Date().toISOString()
    };
    this.data.users.push(user);
    this.persist();
    return this.sanitizeUser(user);
  }

  public findUserByEmail(email: string): StoredUser | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string): User | undefined {
    const user = this.data.users.find(u => u.id === id);
    return user ? this.sanitizeUser(user) : undefined;
  }

  private sanitizeUser(user: StoredUser): User {
    const { passwordHash, ...safe } = user;
    return safe;
  }

  // Analyses methods
  public saveAnalysis(analysis: Omit<SavedAnalysis, 'id' | 'createdAt'>): SavedAnalysis {
    const newEntry: SavedAnalysis = {
      id: uuidv4(),
      ...analysis,
      createdAt: new Date().toISOString()
    };
    this.data.analyses.unshift(newEntry);
    this.persist();
    return newEntry;
  }

  public getAnalyses(userId?: string): SavedAnalysis[] {
    if (userId) {
      return this.data.analyses.filter(a => a.userId === userId);
    }
    return this.data.analyses;
  }

  public getAnalysisById(id: string): SavedAnalysis | undefined {
    return this.data.analyses.find(a => a.id === id);
  }

  public deleteAnalysis(id: string): boolean {
    const initialLength = this.data.analyses.length;
    this.data.analyses = this.data.analyses.filter(a => a.id !== id);
    if (this.data.analyses.length !== initialLength) {
      this.persist();
      return true;
    }
    return false;
  }

  // Aggregate stats for Developer Dashboard
  public getDashboardStats(): DashboardStats {
    const totalScans = this.data.analyses.length;
    if (totalScans === 0) {
      return {
        totalScans: 0,
        projectHealth: 100,
        grade: 'A',
        totalLoc: 0,
        totalFindings: { critical: 0, warning: 0, info: 0 },
        avgCyclomatic: 1,
        avgMaintainability: 100,
        complexityDistribution: {},
        recentScans: []
      };
    }

    let totalLoc = 0;
    let totalCyclomatic = 0;
    let totalMaintainability = 0;
    const findingsCount = { critical: 0, warning: 0, info: 0 };
    const complexityDist: Record<string, number> = {};

    this.data.analyses.forEach(entry => {
      totalLoc += entry.result.metrics.codeLines;
      totalCyclomatic += entry.result.metrics.cyclomaticComplexity;
      totalMaintainability += entry.result.metrics.maintainabilityIndex;

      entry.result.findings.forEach(f => {
        if (f.severity === 'critical') findingsCount.critical++;
        else if (f.severity === 'warning') findingsCount.warning++;
        else findingsCount.info++;
      });

      const time = entry.result.complexity.timeComplexity || 'O(1)';
      complexityDist[time] = (complexityDist[time] || 0) + 1;
    });

    const avgCyclomatic = Math.round((totalCyclomatic / totalScans) * 10) / 10;
    const avgMaintainability = Math.round(totalMaintainability / totalScans);

    // Health Score calculation (0 to 100)
    // Decreased by critical issues (-15), warnings (-5), low maintainability
    const penalty = (findingsCount.critical * 18) + (findingsCount.warning * 5);
    const health = Math.max(20, Math.min(100, Math.round(avgMaintainability - (penalty / totalScans))));

    let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'B';
    if (health >= 90) grade = 'A';
    else if (health >= 75) grade = 'B';
    else if (health >= 60) grade = 'C';
    else if (health >= 45) grade = 'D';
    else grade = 'F';

    return {
      totalScans,
      projectHealth: health,
      grade,
      totalLoc,
      totalFindings: findingsCount,
      avgCyclomatic,
      avgMaintainability,
      complexityDistribution: complexityDist,
      recentScans: this.data.analyses.slice(0, 10)
    };
  }
}

export const db = new Database();
