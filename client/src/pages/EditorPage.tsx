import React, { useState } from 'react';
import Editor, { DiffEditor } from '@monaco-editor/react';
import { 
  Play, 
  Trash2, 
  Columns, 
  Sparkles, 
  Bookmark, 
  Clock, 
  Layers, 
  CheckCircle2, 
  ShieldAlert,
  Terminal,
  X,
  ChevronUp,
  ChevronDown,
  Check,
  Cpu,
  Key
} from 'lucide-react';
import { AnalysisResult, SupportedLanguage, ExecutionResult } from '../shared/types';

interface EditorPageProps {
  code: string;
  setCode: (code: string) => void;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  result: AnalysisResult | null;
  onRunAnalysis: () => Promise<void>;
  loading: boolean;
  onSaveToHistory: (name: string) => Promise<void>;
  geminiApiKey?: string;
  onOpenSettings?: () => void;
}

const SAMPLE_CODES: Record<string, { language: SupportedLanguage; code: string; label: string }> = {
  binarySearch: {
    label: 'Binary Search (O(log n) C++)',
    language: 'cpp',
    code: `// DevLens Sample: Binary Search Algorithm
#include <iostream>
#include <vector>

int binarySearch(const std::vector<int>& arr, int target) {
    int left = 0;
    int right = arr.size() - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}

int main() {
    std::vector<int> data = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
    int target = 23;
    int result = binarySearch(data, target);

    if (result != -1) {
        std::cout << "Element found at index: " << result << std::endl;
    } else {
        std::cout << "Element not found in array." << std::endl;
    }
    return 0;
}`
  },
  nestedLoop: {
    label: 'Nested Loops (O(n²) C++)',
    language: 'cpp',
    code: `// DevLens Sample: Nested loops in C++
#include <iostream>
using namespace std;

int main() {
    int n = 10;
    // Quadratic computation loop
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            cout << i + j << " ";
        }
        cout << "\\n";
    }
    return 0;
}`
  },
  pythonAlgo: {
    label: 'Two Sum Two-Pointer (Python)',
    language: 'python',
    code: `# DevLens Sample: Two Sum on Sorted Array
def two_sum(numbers, target):
    left, right = 0, len(numbers) - 1
    while left < right:
        curr_sum = numbers[left] + numbers[right]
        if curr_sum == target:
            return [left + 1, right + 1]
        elif curr_sum < target:
            left += 1
        else:
            right -= 1
    return []

# Driver code
arr = [2, 7, 11, 15]
target = 9
print("Found indices:", two_sum(arr, target))
`
  },
  insecureJs: {
    label: 'Insecure JavaScript (Eval & Debug Logs)',
    language: 'javascript',
    code: `// DevLens Sample: Security & Quality Smells
function executeTask(userInput) {
  console.log("Processing payload:", userInput);
  
  // FIXME: Security audit required
  const apiKey = "AIzaSyD9834FakeSecretKeyExample98234";
  
  try {
    eval(userInput);
  } catch (err) {}

  document.getElementById("output").innerHTML = userInput;
}

executeTask("2 + 2");
`
  },
  hldPalindrome: {
    label: 'Heavy-Light Decomposition (O(N + Q log² N) C++)',
    language: 'cpp',
    code: `// DevLens Sample: Heavy-Light Decomposition & Segment Tree
class Solution {
public:
    vector<bool> palindromePath(int n, vector<vector<int>>& edges, string s, vector<string>& queries) {
        vector<vector<int>> g(n);
        for (const auto& edge : edges) {
            int u = edge[0], v = edge[1];
            g[u].push_back(v);
            g[v].push_back(u);
        }

        vector<int> parent(n, -1), depth(n), order{0};
        parent[0] = 0;
        for (int i = 0; i < (int)order.size(); ++i) {
            int u = order[i];
            for (int v : g[u]) {
                if (v != parent[u]) {
                    parent[v] = u;
                    depth[v] = depth[u] + 1;
                    order.push_back(v);
                }
            }
        }

        vector<int> size(n, 1), heavy(n, -1);
        for (int i = n - 1; i > 0; --i) {
            int u = order[i], p = parent[u];
            size[p] += size[u];
            if (heavy[p] == -1 || size[u] > size[heavy[p]]) heavy[p] = u;
        }

        vector<int> head(n), pos(n);
        int cur = 0;
        vector<pair<int, int>> stack{{0, 0}};
        while (!stack.empty()) {
            auto [u, h] = stack.back();
            stack.pop_back();
            while (u != -1) {
                head[u] = h;
                pos[u] = cur++;
                for (int v : g[u]) {
                    if (v != parent[u] && v != heavy[u]) stack.emplace_back(v, v);
                }
                u = heavy[u];
            }
        }

        int size2 = 1;
        while (size2 < n) size2 <<= 1;
        vector<int> seg(2 * size2);

        auto pathQuery = [&](int u, int v) {
            int res = 0;
            while (head[u] != head[v]) {
                if (depth[head[u]] < depth[head[v]]) swap(u, v);
                u = parent[head[u]];
            }
            return res;
        };

        vector<bool> ans;
        for (const string& q : queries) {
            // Process query
        }
        return ans;
    }
};`
  }
};

export const EditorPage: React.FC<EditorPageProps> = ({
  code,
  setCode,
  language,
  setLanguage,
  result,
  onRunAnalysis,
  loading,
  onSaveToHistory,
  geminiApiKey,
  onOpenSettings
}) => {
  const [activeTab, setActiveTab] = useState<'findings' | 'complexity' | 'suggestions'>('findings');
  const [editorMode, setEditorMode] = useState<'standard' | 'diff'>('standard');
  const [saveName, setSaveName] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Execution & Terminal State
  const [runningCode, setRunningCode] = useState(false);
  const [execResult, setExecResult] = useState<ExecutionResult | null>(null);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalTab, setTerminalTab] = useState<'output' | 'input'>('output');
  const [stdinInput, setStdinInput] = useState('');

  const handleClearCode = () => {
    setCode('');
  };

  const handleSampleChange = (key: string) => {
    const sample = SAMPLE_CODES[key];
    if (sample) {
      setLanguage(sample.language);
      setCode(sample.code);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    const name = saveName.trim() || `Scan ${language.toUpperCase()} (${new Date().toLocaleTimeString()})`;
    setSaving(true);
    await onSaveToHistory(name);
    setSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Run Code in Editor
  const handleRunCode = async () => {
    setRunningCode(true);
    setTerminalOpen(true);
    setTerminalTab('output');

    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          stdin: stdinInput
        })
      });

      const data: ExecutionResult = await res.json();
      setExecResult(data);
    } catch (err: any) {
      setExecResult({
        stdout: '',
        stderr: `Execution request failed: ${err.message || 'Cannot reach API server'}`,
        exitCode: 1,
        executionTimeMs: 0,
        status: 'error'
      });
    } finally {
      setRunningCode(false);
    }
  };

  // Severity counts
  const criticalCount = result?.findings.filter(f => f.severity === 'critical').length || 0;
  const warningCount = result?.findings.filter(f => f.severity === 'warning').length || 0;
  const infoCount = result?.findings.filter(f => f.severity === 'info').length || 0;

  const refactoredSnippet = result?.aiReview?.optimizations?.[0]?.afterSnippet 
    ? `// === DevLens AI Refactored Code ===\n${result.aiReview.optimizations[0].afterSnippet}\n\n// Original Code Reference:\n${code}`
    : code;

  return (
    <div className="analyzer-layout">
      {/* Editor Toolbar */}
      <div className="analyzer-toolbar">
        <div className="analyzer-toolbar-left">
          {/* Preset Selector */}
          <select 
            className="select-clean"
            onChange={(e) => handleSampleChange(e.target.value)}
            defaultValue="binarySearch"
          >
            <option disabled>Load Example Code</option>
            {Object.entries(SAMPLE_CODES).map(([k, item]) => (
              <option key={k} value={k}>{item.label}</option>
            ))}
          </select>

          {/* Language Selector */}
          <select 
            className="select-clean"
            value={language}
            onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
          >
            <option value="cpp">C++</option>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="java">Java</option>
          </select>

          {/* Diff View Toggle */}
          <button 
            className={`btn-secondary ${editorMode === 'diff' ? 'active' : ''}`}
            onClick={() => setEditorMode(editorMode === 'standard' ? 'diff' : 'standard')}
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
          >
            <Columns size={13} /> {editorMode === 'standard' ? 'Diff View' : 'Standard View'}
          </button>

          {/* Gemini Engine Status Badge */}
          {result?.analysisSource === 'gemini' ? (
            <span className="badge-gemini" title="Analyzed with Google Gemini AI">
              <Sparkles size={12} /> Gemini AI
            </span>
          ) : geminiApiKey ? (
            <span className="badge-gemini" title="Gemini API Key configured and ready">
              <Sparkles size={12} /> Gemini Ready
            </span>
          ) : (
            <button 
              className="gemini-hint-btn" 
              onClick={onOpenSettings}
              title="Add a Gemini API key in Settings for AI-powered complexity analysis"
            >
              <Key size={12} /> Connect Gemini API
            </button>
          )}
        </div>

        <div className="analyzer-toolbar-right">
          {/* Save Scan Form */}
          {result && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <input 
                type="text" 
                placeholder="Scan name..." 
                className="form-input"
                style={{ width: '130px', padding: '0.3rem 0.55rem', fontSize: '0.75rem' }}
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
              />
              <button 
                className="btn-secondary" 
                onClick={handleSave} 
                disabled={saving}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
              >
                {savedSuccess ? <Check size={13} color="var(--primary)" /> : <Bookmark size={13} />}
                {savedSuccess ? 'Saved' : 'Save'}
              </button>
            </div>
          )}

          {/* Clear Code Button */}
          <button 
            className="btn-danger-subtle" 
            onClick={handleClearCode}
            title="Clear editor contents"
          >
            <Trash2 size={14} /> Clear
          </button>

          {/* Run Code Button */}
          <button 
            className="btn-run" 
            onClick={handleRunCode}
            disabled={runningCode}
            title="Compile and run code in isolated sandbox"
          >
            <Play size={13} fill="currentColor" />
            {runningCode ? 'Running...' : 'Run Code'}
          </button>

          {/* Analyze Code Button */}
          <button 
            className="btn-primary" 
            onClick={onRunAnalysis}
            disabled={loading}
          >
            <Cpu size={14} />
            {loading ? 'Analyzing...' : 'Analyze Code'}
          </button>
        </div>
      </div>

      {/* Main Split: Monaco Editor on Left, Results Panel on Right */}
      <div className="workspace-split">
        {/* Left: Code Editor & Terminal Drawer */}
        <div className="editor-canvas-container">
          <div className="monaco-flex-wrapper">
            {editorMode === 'standard' ? (
              <Editor
                height="100%"
                theme="vs-dark"
                language={language === 'cpp' ? 'cpp' : language}
                value={code}
                onChange={(val) => setCode(val || '')}
                options={{
                  fontFamily: "'Fira Code', monospace",
                  fontSize: 13.5,
                  lineHeight: 21,
                  minimap: { enabled: true },
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  tabSize: 2,
                  cursorBlinking: 'smooth',
                  renderLineHighlight: 'all'
                }}
              />
            ) : (
              <DiffEditor
                height="100%"
                theme="vs-dark"
                language={language === 'cpp' ? 'cpp' : language}
                original={code}
                modified={refactoredSnippet}
                options={{
                  fontFamily: "'Fira Code', monospace",
                  fontSize: 13,
                  readOnly: true,
                  automaticLayout: true
                }}
              />
            )}
          </div>

          {/* Collapsible Terminal / Output Drawer */}
          {terminalOpen && (
            <div className="terminal-drawer">
              <div className="terminal-toolbar">
                <div className="terminal-toolbar-left">
                  <Terminal size={14} style={{ color: 'var(--text-muted)' }} />
                  <button 
                    className={`terminal-tab-pill ${terminalTab === 'output' ? 'active' : ''}`}
                    onClick={() => setTerminalTab('output')}
                  >
                    Console Output
                  </button>
                  <button 
                    className={`terminal-tab-pill ${terminalTab === 'input' ? 'active' : ''}`}
                    onClick={() => setTerminalTab('input')}
                  >
                    Standard Input (stdin)
                  </button>

                  {/* Execution Status Badge */}
                  {runningCode && (
                    <span className="terminal-status-badge running">
                      Compiling & Running...
                    </span>
                  )}
                  {!runningCode && execResult && (
                    <span className={`terminal-status-badge ${execResult.status === 'success' ? 'success' : 'error'}`}>
                      {execResult.status === 'success' ? 'Exited (0)' : `Exited (${execResult.exitCode})`} • {execResult.executionTimeMs}ms
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <button 
                    className="btn-icon-subtle" 
                    onClick={() => setExecResult(null)}
                    title="Clear console output"
                  >
                    <Trash2 size={13} />
                  </button>
                  <button 
                    className="btn-icon-subtle" 
                    onClick={() => setTerminalOpen(false)}
                    title="Close terminal drawer"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Terminal Body */}
              <div className="terminal-body">
                {terminalTab === 'output' ? (
                  runningCode ? (
                    <div style={{ color: 'var(--primary)', fontStyle: 'italic' }}>
                      Executing program in secure execution environment...
                    </div>
                  ) : execResult ? (
                    <>
                      {execResult.stdout && (
                        <div style={{ color: 'var(--text-main)' }}>{execResult.stdout}</div>
                      )}
                      {execResult.stderr && (
                        <div style={{ color: 'var(--error)', marginTop: execResult.stdout ? '0.5rem' : 0 }}>
                          {execResult.stderr}
                        </div>
                      )}
                      {!execResult.stdout && !execResult.stderr && (
                        <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          (Program finished with exit code {execResult.exitCode} and no console output)
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ color: 'var(--text-muted)' }}>
                      Press <strong>Run Code</strong> above to compile and run your program. Output will appear here.
                    </div>
                  )
                ) : (
                  <textarea
                    className="terminal-stdin-input"
                    placeholder="Type or paste input for standard input (cin / input() / scanf) before running..."
                    value={stdinInput}
                    onChange={(e) => setStdinInput(e.target.value)}
                  />
                )}
              </div>
            </div>
          )}

          {/* Quick toggle bar if terminal is closed */}
          {!terminalOpen && (
            <div 
              style={{
                height: '28px',
                backgroundColor: '#101612',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 0.85rem',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
              onClick={() => setTerminalOpen(true)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Terminal size={12} />
                <span>Terminal Output {execResult ? `(Last run: ${execResult.executionTimeMs}ms)` : ''}</span>
              </div>
              <ChevronUp size={14} />
            </div>
          )}
        </div>

        {/* Right: Analysis Results Panel */}
        <div className="results-panel">
          {/* Results Tabs Bar */}
          <div className="results-tabs-bar">
            <button 
              className={`results-tab-btn ${activeTab === 'findings' ? 'active' : ''}`}
              onClick={() => setActiveTab('findings')}
            >
              <ShieldAlert size={14} />
              <span>Findings ({result?.findings.length || 0})</span>
            </button>
            <button 
              className={`results-tab-btn ${activeTab === 'complexity' ? 'active' : ''}`}
              onClick={() => setActiveTab('complexity')}
            >
              <Clock size={14} />
              <span>Complexity</span>
            </button>
            <button 
              className={`results-tab-btn ${activeTab === 'suggestions' ? 'active' : ''}`}
              onClick={() => setActiveTab('suggestions')}
            >
              <Sparkles size={14} />
              <span>AI Suggestions</span>
            </button>
          </div>

          {/* Results Body */}
          <div className="results-content-body">
            {!result && !loading && (
              <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
                <Layers size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                <h4 style={{ color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 600 }}>Ready for Inspection</h4>
                <p style={{ fontSize: '0.78rem', marginTop: '0.35rem', lineHeight: 1.5 }}>
                  Click <strong>Analyze Code</strong> to calculate asymptotic Big-O bounds, loop nesting depths, security defects, and AI refactoring diffs.
                </p>
              </div>
            )}

            {loading && (
              <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
                <Clock size={32} style={{ margin: '0 auto 0.75rem', color: 'var(--primary)', animation: 'spin 1.5s linear infinite' }} />
                <p style={{ fontSize: '0.825rem', color: 'var(--text-main)' }}>
                  {geminiApiKey ? 'Consulting Gemini AI for mathematical complexity...' : 'Parsing AST and calculating Big-O bounds...'}
                </p>
              </div>
            )}

            {result && !loading && (
              <>
                {/* Metric Chips Summary */}
                <div className="results-kpi-strip">
                  <div className="kpi-chip">
                    <span className="kpi-chip-label">Time Complexity</span>
                    <span className="kpi-chip-val">{result.complexity.timeComplexity}</span>
                  </div>
                  <div className="kpi-chip">
                    <span className="kpi-chip-label">Auxiliary Space</span>
                    <span className="kpi-chip-val" style={{ color: 'var(--text-main)' }}>{result.complexity.spaceComplexity}</span>
                  </div>
                  <div className="kpi-chip">
                    <span className="kpi-chip-label">Quality Score</span>
                    <span className="kpi-chip-val" style={{ color: result.complexity.score >= 80 ? 'var(--primary)' : 'var(--warning)' }}>
                      {result.complexity.score}/100
                    </span>
                  </div>
                </div>

                {/* Tab 1: Findings */}
                {activeTab === 'findings' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Severity Breakdown:
                      </span>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <span className="finding-pill critical">{criticalCount} Critical</span>
                        <span className="finding-pill warning">{warningCount} Warnings</span>
                        <span className="finding-pill info">{infoCount} Info</span>
                      </div>
                    </div>

                    {result.findings.length === 0 ? (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '2rem 1rem', 
                        backgroundColor: 'var(--bg-card)', 
                        border: '1px solid var(--border)', 
                        borderRadius: '6px' 
                      }}>
                        <CheckCircle2 size={32} color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} />
                        <h4 style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>Zero Defects Detected</h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          No hardcoded secrets, leftover debug statements, or unsafe evaluation patterns found.
                        </p>
                      </div>
                    ) : (
                      <div className="findings-list">
                        {result.findings.map(f => (
                          <div key={f.id} className={`finding-card ${f.severity}`}>
                            <div className="finding-card-header">
                              <span className={`finding-pill ${f.severity}`}>{f.severity}</span>
                              <span className="finding-line">Line {f.line}</span>
                            </div>
                            <div className="finding-message">{f.message}</div>
                            <p className="finding-explanation">{f.explanation}</p>
                            {f.snippet && (
                              <pre style={{ 
                                backgroundColor: 'var(--bg-input)', 
                                padding: '0.35rem 0.55rem', 
                                borderRadius: '4px', 
                                fontSize: '0.75rem',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border)'
                              }}>
                                <code>{f.snippet}</code>
                              </pre>
                            )}
                            {f.suggestion && (
                              <div className="finding-suggestion">
                                <strong>Fix:</strong> {f.suggestion}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Tab 2: Complexity & Loops */}
                {activeTab === 'complexity' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="panel-card" style={{ padding: '1rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Theoretical Asymptotic Derivation
                      </span>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: 1.5, marginTop: '0.4rem' }}>
                        {result.complexity.explanation}
                      </p>
                    </div>

                    <div className="panel-card" style={{ padding: '1rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Loop & Iteration Stages ({result.complexity.loopDetails.length})
                      </span>
                      {result.complexity.loopDetails.length === 0 ? (
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                          No loop structures detected. Logic executes in sequential constant time.
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                          {result.complexity.loopDetails.map((loop, idx) => (
                            <div key={idx} style={{ 
                              padding: '0.65rem 0.75rem', 
                              backgroundColor: 'var(--bg-subtle)', 
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              marginLeft: `${(loop.depth - 1) * 12}px`
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>
                                  Level {loop.depth} ({loop.type})
                                </span>
                                <span className="badge-tag complexity">{loop.complexityContribution}</span>
                              </div>
                              <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                {loop.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab 3: AI Suggestions */}
                {activeTab === 'suggestions' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {result.aiReview?.summary && (
                      <div className="panel-card" style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', marginBottom: '0.35rem' }}>
                          <Sparkles size={15} />
                          <strong style={{ fontSize: '0.8rem' }}>AI Synthesis ({result.analysisSource === 'gemini' ? 'Gemini 2.5/1.5' : 'Heuristic Engine'})</strong>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                          {result.aiReview.summary}
                        </p>
                      </div>
                    )}

                    {result.aiReview?.optimizations && result.aiReview.optimizations.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {result.aiReview.optimizations.map((opt, i) => (
                          <div key={i} className="panel-card" style={{ padding: '1rem', borderLeft: '3px solid var(--primary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                              <span className="badge-tag complexity">{opt.impact.toUpperCase()} IMPACT</span>
                              <strong style={{ fontSize: '0.825rem', color: 'var(--text-main)' }}>{opt.title}</strong>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                              {opt.description}
                            </p>
                            {opt.beforeSnippet && opt.afterSnippet && (
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <div>
                                  <div style={{ fontSize: '0.68rem', color: 'var(--error)', fontWeight: 600 }}>CURRENT</div>
                                  <pre style={{ backgroundColor: 'var(--bg-input)', padding: '0.35rem', borderRadius: '4px', fontSize: '0.72rem', border: '1px solid var(--border)', overflowX: 'auto' }}>
                                    <code>{opt.beforeSnippet}</code>
                                  </pre>
                                </div>
                                <div>
                                  <div style={{ fontSize: '0.68rem', color: 'var(--primary)', fontWeight: 600 }}>REFACTORED</div>
                                  <pre style={{ backgroundColor: 'var(--bg-input)', padding: '0.35rem', borderRadius: '4px', fontSize: '0.72rem', border: '1px solid var(--border)', overflowX: 'auto' }}>
                                    <code>{opt.afterSnippet}</code>
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
