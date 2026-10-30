import React from 'react';
import { 
  Clock, 
  Layers, 
  TrendingUp, 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  GitBranch,
  BookOpen
} from 'lucide-react';
import { AnalysisResult } from '../shared/types';

interface ComplexityPageProps {
  result: AnalysisResult | null;
  onNavigateToEditor: () => void;
}

export const ComplexityPage: React.FC<ComplexityPageProps> = ({ result, onNavigateToEditor }) => {
  if (!result) {
    return (
      <div className="page-empty-state">
        <Clock size={48} className="empty-icon text-muted" />
        <h2>No Complexity Data Available</h2>
        <p>Run a code analysis in the Code Editor to view Big-O time and space estimation, loop nesting levels, and recursion call graphs.</p>
        <button className="btn-primary" onClick={onNavigateToEditor}>
          Go to Code Editor
        </button>
      </div>
    );
  }

  const { complexity } = result;
  const isQuadratic = complexity.timeComplexity.includes('n^2');
  const isLinear = complexity.timeComplexity === 'O(n)';
  const isLogarithmic = complexity.timeComplexity.includes('log');
  const isConstant = complexity.timeComplexity === 'O(1)';
  const isExponential = complexity.timeComplexity.includes('2^n');

  return (
    <div className="page-content complexity-view">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Algorithmic Complexity & Big-O Visualizer</h1>
          <p className="page-subtitle">
            Deterministic AST loop depth counting, recursion branching detection, and auxiliary memory estimation.
          </p>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="complexity-kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">TIME COMPLEXITY</span>
          <span className="kpi-val text-blue font-mono">{complexity.timeComplexity}</span>
          <span className="kpi-sub">
            {isQuadratic ? 'Quadratic growth — scales with n²' : isLinear ? 'Linear growth — scales with n' : isConstant ? 'Constant time — immediate execution' : 'Exponential growth — urgent optimization'}
          </span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">AUXILIARY SPACE</span>
          <span className="kpi-val text-green font-mono">{complexity.spaceComplexity}</span>
          <span className="kpi-sub">
            {complexity.spaceComplexity === 'O(1)' ? 'No extra memory allocations' : 'Allocates proportional auxiliary heap/stack'}
          </span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">PERFORMANCE SCORE</span>
          <span className={`kpi-val font-mono ${complexity.score >= 80 ? 'text-green' : complexity.score >= 50 ? 'text-amber' : 'text-red'}`}>
            {complexity.score}/100
          </span>
          <span className="kpi-sub">Based on Big-O rating & iteration depth</span>
        </div>
      </div>

      {/* Interactive Big-O Notation Graph (Directly modeled after Image 5) */}
      <div className="big-o-full-card">
        <div className="big-o-card-header">
          <div>
            <h2 className="section-title">
              <TrendingUp size={20} color="#60a5fa" />
              Big O Asymptotic Growth Curves
            </h2>
            <p className="section-subtitle">
              Visualizing how runtime scales as the input size (n) tends toward infinity.
            </p>
          </div>
          <div className="current-algorithm-badge">
            <span>Your Code:</span>
            <strong className="badge-highlight-pill">{complexity.timeComplexity}</strong>
          </div>
        </div>

        <div className="big-o-canvas-box">
          <svg viewBox="0 0 700 300" className="big-o-svg-large">
            {/* Background Grid */}
            <line x1="60" y1="20" x2="60" y2="250" stroke="#334155" strokeWidth="2" />
            <line x1="60" y1="250" x2="660" y2="250" stroke="#334155" strokeWidth="2" />
            
            {/* Axis Labels */}
            <text x="18" y="140" fill="#94a3b8" fontSize="13" fontWeight="600" transform="rotate(-90 18 140)">
              Time / Operations →
            </text>
            <text x="320" y="280" fill="#94a3b8" fontSize="13" fontWeight="600">
              Input Size (n) →
            </text>

            {/* O(1) Constant Curve: Green */}
            <line 
              x1="60" y1="220" x2="650" y2="220" 
              stroke="#10b981" 
              strokeWidth={isConstant ? 5 : 2.5} 
              strokeDasharray={isConstant ? '0' : '4 2'}
            />
            <text x="610" y="210" fill="#10b981" fontSize="13" fontWeight="700">O(1)</text>

            {/* O(log n) Sub-linear Curve: Yellow */}
            <path 
              d="M 60 250 Q 200 180, 650 170" 
              fill="none" 
              stroke="#facc15" 
              strokeWidth={isLogarithmic ? 5 : 2.5} 
            />
            <text x="600" y="160" fill="#facc15" fontSize="13" fontWeight="700">O(log n)</text>

            {/* O(n) Linear Curve: Blue */}
            <line 
              x1="60" y1="250" x2="620" y2="80" 
              stroke="#3b82f6" 
              strokeWidth={isLinear ? 5 : 2.5} 
            />
            <text x="580" y="70" fill="#3b82f6" fontSize="13" fontWeight="700">O(n)</text>

            {/* O(n^2) Quadratic Curve: Red */}
            <path 
              d="M 60 250 Q 220 230, 240 30" 
              fill="none" 
              stroke="#ef4444" 
              strokeWidth={isQuadratic ? 5 : 2.5} 
            />
            <text x="210" y="25" fill="#ef4444" fontSize="13" fontWeight="700">O(n²)</text>

            {/* Indicator on current active curve */}
            {isQuadratic && (
              <g>
                <circle cx="215" cy="115" r="7" fill="#ef4444" />
                <circle cx="215" cy="115" r="14" fill="none" stroke="#ef4444" strokeWidth="2" opacity="0.6" className="pulse-circle" />
                <rect x="235" y="98" width="160" height="34" rx="4" fill="#1e293b" stroke="#ef4444" />
                <text x="245" y="120" fill="#fff" fontSize="11" fontWeight="600">Your Routine: O(n²)</text>
              </g>
            )}

            {isLinear && (
              <g>
                <circle cx="340" cy="165" r="7" fill="#3b82f6" />
                <circle cx="340" cy="165" r="14" fill="none" stroke="#3b82f6" strokeWidth="2" opacity="0.6" className="pulse-circle" />
                <rect x="360" y="148" width="150" height="34" rx="4" fill="#1e293b" stroke="#3b82f6" />
                <text x="370" y="170" fill="#fff" fontSize="11" fontWeight="600">Your Routine: O(n)</text>
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Explanatory Breakdown Cards */}
      <div className="complexity-details-grid">
        {/* Loop Hierarchy Breakdown */}
        <div className="dashboard-card">
          <div className="card-header-flex">
            <h3 className="card-heading">
              <Layers size={18} color="#8b5cf6" />
              Loop & Iteration Depth Hierarchy
            </h3>
            <span className="badge-count">{complexity.loopDetails.length} Detected</span>
          </div>

          {complexity.loopDetails.length === 0 ? (
            <p className="empty-subtext">No loop constructs detected. Operations execute sequentially.</p>
          ) : (
            <div className="loop-tree-list">
              {complexity.loopDetails.map((loop, idx) => (
                <div key={idx} className="loop-node" style={{ marginLeft: `${(loop.depth - 1) * 20}px` }}>
                  <div className="loop-node-header">
                    <span className="loop-depth-badge">Depth {loop.depth} • {loop.type}</span>
                    <span className="loop-cost-tag">{loop.complexityContribution}</span>
                  </div>
                  <div className="loop-desc">{loop.description}</div>
                  {loop.iteratorStep && (
                    <div className="loop-step-snippet font-mono">{loop.iteratorStep}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recursion & Reasoning Card */}
        <div className="dashboard-card">
          <div className="card-header-flex">
            <h3 className="card-heading">
              <BookOpen size={18} color="#60a5fa" />
              Theoretical Complexity Reasoning
            </h3>
          </div>
          <p className="reasoning-text">
            {complexity.explanation}
          </p>

          {complexity.recursionDetails?.hasRecursion && (
            <div className="recursion-alert-box">
              <div className="recursion-header">
                <GitBranch size={18} color="#f59e0b" />
                <span>Recursive Call Chain Detected: {complexity.recursionDetails.functionName}()</span>
              </div>
              <p className="recursion-detail-text">
                {complexity.recursionDetails.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
