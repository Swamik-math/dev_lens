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
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert,
  Info,
  Check
} from 'lucide-react';
import { AnalysisResult, SupportedLanguage } from '../shared/types';

interface EditorPageProps {
  code: string;
  setCode: (code: string) => void;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  result: AnalysisResult | null;
  onRunAnalysis: () => Promise<void>;
  loading: boolean;
  onSaveToHistory: (name: string) => Promise<void>;
}

const SAMPLE_CODES: Record<string, { language: SupportedLanguage; code: string; label: string }> = {
  nestedLoop: {
    label: 'Nested Loops (O(n²) C++)',
    language: 'cpp',
    code: `// DevLens Sample: Nested loops in C++
#include <iostream>
using namespace std;

int main() {
    int n = 100;
    // TODO: Optimize this quadratic bottleneck
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            cout << i + j;
        }
    }
    return 0;
}`
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
}`
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
  },
  recursion: {
    label: 'Recursive Fibonacci (O(2ⁿ) Exponential)',
    language: 'javascript',
    code: `// DevLens Sample: Exponential Branching Recursion
function fibonacci(n) {
  if (n <= 1) return n;
  // Multiple recursive branch calls
  return fibonacci(n - 1) + fibonacci(n - 2);
}`
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
  onSaveToHistory
}) => {
  const [activeTab, setActiveTab] = useState<'findings' | 'complexity' | 'suggestions'>('findings');
  const [editorMode, setEditorMode] = useState<'standard' | 'diff'>('standard');
  const [saveName, setSaveName] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

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
            defaultValue="nestedLoop"
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
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
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

          {/* Analyze Code Button (Primary Emerald) */}
          <button 
            className="btn-primary" 
            onClick={onRunAnalysis}
            disabled={loading}
          >
            <Play size={13} fill="currentColor" />
            {loading ? 'Analyzing AST...' : 'Analyze Code'}
          </button>
        </div>
      </div>

      {/* Main Split: Monaco Editor on Left, Results Panel on Right */}
      <div className="workspace-split">
        {/* Left: Code Editor */}
        <div className="editor-canvas-container">
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
              <span>Complexity & Loops</span>
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
                  Click <strong>Analyze Code</strong> above to inspect time/space complexity, loop nesting depth, security defects, and AI refactoring advice.
                </p>
              </div>
            )}

            {loading && (
              <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
                <Clock size={32} style={{ margin: '0 auto 0.75rem', color: 'var(--primary)', animation: 'spin 1.5s linear infinite' }} />
                <p style={{ fontSize: '0.825rem', color: 'var(--text-main)' }}>Parsing AST and calculating Big-O bounds...</p>
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
                          <strong style={{ fontSize: '0.8rem' }}>AI Synthesis</strong>
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
