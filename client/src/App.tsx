import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Play, 
  Cpu, 
  ShieldAlert, 
  Sparkles, 
  Layers, 
  BarChart2, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Code2, 
  BookOpen
} from 'lucide-react';
import { AnalysisResult, SupportedLanguage } from './shared/types';

const SAMPLE_CODES: Record<string, { language: SupportedLanguage; code: string; label: string }> = {
  nestedLoop: {
    label: 'Nested Loop (O(n²) C++)',
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
  recursion: {
    label: 'Recursive Fibonacci (O(2ⁿ) Exponential)',
    language: 'javascript',
    code: `// DevLens Sample: Exponential Branching Recursion
function fibonacci(n) {
  if (n <= 1) return n;
  // Multiple recursive branch calls
  return fibonacci(n - 1) + fibonacci(n - 2);
}`
  },
  linearOptimized: {
    label: 'Linear Search with Set (O(n) TypeScript)',
    language: 'typescript',
    code: `// DevLens Sample: Linear lookup using HashSet
export function twoSum(nums: number[], target: number): [number, number] | null {
  const map = new Map<number, number>();
  
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement)!, i];
    }
    map.set(nums[i], i);
  }
  return null;
}`
  }
};

export function App() {
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('cpp');
  const [code, setCode] = useState<string>(SAMPLE_CODES.nestedLoop.code);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'complexity' | 'findings' | 'ai'>('overview');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language: selectedLanguage,
          includeAi: true
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data: AnalysisResult = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to connect to DevLens Analysis Engine.');
    } finally {
      setLoading(false);
    }
  };

  const handleSampleChange = (key: string) => {
    const sample = SAMPLE_CODES[key];
    if (sample) {
      setSelectedLanguage(sample.language);
      setCode(sample.code);
      setResult(null);
    }
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <header className="navbar">
        <div className="brand">
          <div className="brand-icon">
            <Code2 size={20} color="#fff" />
          </div>
          <div>
            <span className="brand-title">DevLens</span>
            <span className="brand-tagline">See beyond the code</span>
          </div>
        </div>

        <div className="nav-actions">
          {/* Sample preset selector */}
          <select 
            className="select-input" 
            onChange={(e) => handleSampleChange(e.target.value)}
            defaultValue="nestedLoop"
          >
            <option disabled>── Choose Sample Preset ──</option>
            {Object.entries(SAMPLE_CODES).map(([k, item]) => (
              <option key={k} value={k}>{item.label}</option>
            ))}
          </select>

          {/* Language selector */}
          <select 
            className="select-input"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value as SupportedLanguage)}
          >
            <option value="cpp">C++</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
          </select>

          {/* Run Analysis CTA */}
          <button 
            className="btn-primary" 
            onClick={handleRunAnalysis}
            disabled={loading}
          >
            <Play size={16} fill="currentColor" />
            {loading ? 'Analyzing...' : 'Analyze Code'}
          </button>
        </div>
      </header>

      {/* Main Split Grid */}
      <div className="workspace-grid">
        {/* Left Pane: Code Editor */}
        <section className="editor-pane">
          <div className="editor-header">
            <span>Editor • {selectedLanguage.toUpperCase()}</span>
            <span>{code.split('\n').length} lines</span>
          </div>
          <div className="editor-wrapper">
            <Editor
              height="100%"
              theme="vs-dark"
              language={selectedLanguage === 'cpp' ? 'cpp' : selectedLanguage}
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                fontFamily: "'Fira Code', monospace",
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                cursorBlinking: 'smooth'
              }}
            />
          </div>
        </section>

        {/* Right Pane: Analysis Dashboard */}
        <section className="dashboard-pane">
          {/* Tabs Navigation */}
          <div className="tabs-header">
            <button 
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <BarChart2 size={16} /> Overview
            </button>
            <button 
              className={`tab-btn ${activeTab === 'complexity' ? 'active' : ''}`}
              onClick={() => setActiveTab('complexity')}
            >
              <Clock size={16} /> Complexity
            </button>
            <button 
              className={`tab-btn ${activeTab === 'findings' ? 'active' : ''}`}
              onClick={() => setActiveTab('findings')}
            >
              <ShieldAlert size={16} /> Findings ({result?.findings.length || 0})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
              onClick={() => setActiveTab('ai')}
            >
              <Sparkles size={16} /> AI Review
            </button>
          </div>

          {/* Tab Contents */}
          <div className="tab-content">
            {error && (
              <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '6px', color: '#f87171' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                  <AlertOctagon size={18} /> Analysis Error
                </div>
                <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>{error}</p>
              </div>
            )}

            {!result && !loading && !error && (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <Layers size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
                <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Ready for Analysis</h3>
                <p style={{ fontSize: '0.875rem', maxWidth: '360px', margin: '0 auto' }}>
                  Write or paste code in the editor, or choose a preset sample above, then click <strong>Analyze Code</strong> to view Big-O complexity, quality findings, and AI insights.
                </p>
              </div>
            )}

            {loading && (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <Cpu size={40} className="animate-spin" style={{ margin: '0 auto 1rem', color: 'var(--accent-blue)' }} />
                <p>Traversing AST, calculating Big-O and executing rule engine...</p>
              </div>
            )}

            {result && !loading && (
              <>
                {/* 1. OVERVIEW TAB */}
                {activeTab === 'overview' && (
                  <>
                    {/* Complexity Quick Banner */}
                    <div className="complexity-banner">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Time Complexity</span>
                          <h2 style={{ fontSize: '2rem', fontFamily: 'Fira Code', color: '#60a5fa' }}>{result.complexity.timeComplexity}</h2>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Space Complexity</span>
                          <h2 style={{ fontSize: '2rem', fontFamily: 'Fira Code', color: '#34d399' }}>{result.complexity.spaceComplexity}</h2>
                        </div>
                      </div>
                      <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                        {result.complexity.explanation}
                      </p>
                    </div>

                    {/* Metric Cards Grid */}
                    <div className="metrics-grid">
                      <div className="metric-card">
                        <span className="metric-label">Performance Score</span>
                        <span className={`metric-value ${result.complexity.score >= 80 ? 'badge-green' : result.complexity.score >= 50 ? 'badge-amber' : 'badge-red'}`}>
                          {result.complexity.score}/100
                        </span>
                      </div>
                      <div className="metric-card">
                        <span className="metric-label">Maintainability Index</span>
                        <span className={`metric-value ${result.metrics.maintainabilityIndex >= 70 ? 'badge-green' : 'badge-amber'}`}>
                          {result.metrics.maintainabilityIndex}/100
                        </span>
                      </div>
                      <div className="metric-card">
                        <span className="metric-label">Cyclomatic Complexity</span>
                        <span className="metric-value badge-blue">{result.metrics.cyclomaticComplexity}</span>
                      </div>
                      <div className="metric-card">
                        <span className="metric-label">Lines of Code (LOC)</span>
                        <span className="metric-value">{result.metrics.codeLines}</span>
                      </div>
                    </div>

                    {/* Summary Card */}
                    <div className="section-card">
                      <div className="section-title">
                        <BookOpen size={18} color="#60a5fa" />
                        Executive Summary
                      </div>
                      <p style={{ fontSize: '0.85rem', lineHeight: 1.5, color: '#e2e8f0' }}>
                        {result.aiReview?.summary || 'Code evaluated successfully with static rule verification.'}
                      </p>
                    </div>
                  </>
                )}

                {/* 2. COMPLEXITY BREAKDOWN TAB */}
                {activeTab === 'complexity' && (
                  <>
                    <div className="section-card">
                      <div className="section-title">
                        <Clock size={18} color="#60a5fa" />
                        Time & Space Analysis Engine
                      </div>
                      <div style={{ display: 'flex', gap: '1.5rem', margin: '0.5rem 0' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TIME ASYMPTOTIC</div>
                          <div style={{ fontSize: '1.5rem', fontFamily: 'Fira Code', color: '#60a5fa' }}>{result.complexity.timeComplexity}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AUXILIARY SPACE</div>
                          <div style={{ fontSize: '1.5rem', fontFamily: 'Fira Code', color: '#34d399' }}>{result.complexity.spaceComplexity}</div>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                        {result.complexity.explanation}
                      </p>
                    </div>

                    {/* Loop Hierarchy */}
                    <div className="section-card">
                      <div className="section-title">
                        <Layers size={18} color="#8b5cf6" />
                        Loop & Branch Hierarchy
                      </div>
                      {result.complexity.loopDetails.length === 0 ? (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No iteration constructs or loops detected.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {result.complexity.loopDetails.map((loop, idx) => (
                            <div key={idx} style={{ 
                              padding: '0.75rem', 
                              backgroundColor: '#0f172a', 
                              borderRadius: '6px', 
                              border: '1px solid var(--border-color)',
                              marginLeft: `${(loop.depth - 1) * 16}px`
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.8rem', color: '#c084fc' }}>
                                  Level {loop.depth} Loop ({loop.type})
                                </span>
                                <span style={{ fontFamily: 'Fira Code', fontSize: '0.75rem', color: '#60a5fa', background: 'rgba(59,130,246,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                  {loop.complexityContribution}
                                </span>
                              </div>
                              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                {loop.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Recursion Details if present */}
                    {result.complexity.recursionDetails?.hasRecursion && (
                      <div className="section-card" style={{ borderColor: '#f59e0b' }}>
                        <div className="section-title" style={{ color: '#fbbf24' }}>
                          <AlertTriangle size={18} />
                          Recursive Call Graph Detected
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                          {result.complexity.recursionDetails.description}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* 3. FINDINGS & ISSUES TAB */}
                {activeTab === 'findings' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Total issues detected: <strong>{result.findings.length}</strong>
                      </span>
                    </div>

                    {result.findings.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem', color: '#34d399' }}>
                        <CheckCircle2 size={36} style={{ margin: '0 auto 0.5rem' }} />
                        <p style={{ fontWeight: 600 }}>Zero Static Issues Detected</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No TODOs, debug logs, or unsafe patterns found.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {result.findings.map((f) => (
                          <div key={f.id} className={`finding-item ${f.severity}`}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className={`severity-pill ${f.severity}`}>{f.severity}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Line {f.line}</span>
                                <span style={{ fontSize: '0.75rem', color: '#60a5fa', textTransform: 'capitalize' }}>[{f.category}]</span>
                              </div>
                            </div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>
                              {f.message}
                            </div>
                            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                              {f.explanation}
                            </p>
                            {f.snippet && (
                              <div className="code-snippet font-mono">{f.snippet}</div>
                            )}
                            {f.suggestion && (
                              <div style={{ fontSize: '0.75rem', color: '#34d399', background: 'rgba(16, 185, 129, 0.1)', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                                <strong>Fix:</strong> {f.suggestion}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* 4. AI REVIEW & REFACTORING TAB */}
                {activeTab === 'ai' && (
                  <>
                    <div className="section-card">
                      <div className="section-title">
                        <Sparkles size={18} color="#c084fc" />
                        Cognitive AI Assessment
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Assessment:</span>
                        <span style={{ 
                          fontSize: '0.85rem', 
                          fontWeight: 700,
                          color: result.aiReview?.overallRating === 'Critical Issues' ? '#f87171' : '#34d399'
                        }}>
                          {result.aiReview?.overallRating || 'Good'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                        {result.aiReview?.explanation}
                      </p>
                    </div>

                    {/* Optimizations */}
                    {result.aiReview?.optimizations && result.aiReview.optimizations.length > 0 && (
                      <div className="section-card">
                        <div className="section-title">
                          <Cpu size={18} color="#34d399" />
                          Recommended Algorithmic Optimizations
                        </div>
                        {result.aiReview.optimizations.map((opt, i) => (
                          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ 
                                fontSize: '0.7rem', 
                                padding: '2px 6px', 
                                borderRadius: '4px',
                                background: opt.impact === 'high' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                color: opt.impact === 'high' ? '#f87171' : '#60a5fa',
                                fontWeight: 600,
                                textTransform: 'uppercase'
                              }}>
                                {opt.impact} Impact
                              </span>
                              <strong style={{ fontSize: '0.85rem' }}>{opt.title}</strong>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{opt.description}</p>
                            {opt.beforeSnippet && opt.afterSnippet && (
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.25rem' }}>
                                <div>
                                  <span style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 600 }}>CURRENT IMPLEMENTATION</span>
                                  <pre className="code-snippet font-mono" style={{ fontSize: '0.75rem', marginTop: '4px' }}>{opt.beforeSnippet}</pre>
                                </div>
                                <div>
                                  <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 600 }}>OPTIMIZED PATTERN</span>
                                  <pre className="code-snippet font-mono" style={{ fontSize: '0.75rem', marginTop: '4px' }}>{opt.afterSnippet}</pre>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
export default App;
