import React from 'react';
import { 
  Sparkles, 
  Cpu, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  Code2,
  Lightbulb
} from 'lucide-react';
import { AnalysisResult } from '../shared/types';

interface AiReviewPageProps {
  result: AnalysisResult | null;
  onNavigateToEditor: () => void;
}

export const AiReviewPage: React.FC<AiReviewPageProps> = ({ result, onNavigateToEditor }) => {
  if (!result || !result.aiReview) {
    return (
      <div className="page-empty-state">
        <Sparkles size={48} className="empty-icon text-muted" />
        <h2>No AI Review Generated</h2>
        <p>Run a code analysis in the Code Editor to generate an AI cognitive review, algorithmic optimizations, and before/after refactoring diffs.</p>
        <button className="btn-primary" onClick={onNavigateToEditor}>
          Go to Code Editor
        </button>
      </div>
    );
  }

  const { aiReview, complexity, metrics } = result;

  return (
    <div className="page-content ai-review-view">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Cognitive Code Review & Refactoring</h1>
          <p className="page-subtitle">
            Synthesizing deterministic AST metrics with cognitive explanations and algorithmic refactor diffs.
          </p>
        </div>
        <div className={`rating-pill-large ${aiReview.overallRating === 'Critical Issues' ? 'red' : aiReview.overallRating === 'Needs Improvement' ? 'amber' : 'green'}`}>
          Rating: {aiReview.overallRating}
        </div>
      </div>

      {/* Summary Card */}
      <div className="dashboard-card ai-summary-card">
        <div className="card-header-flex">
          <h3 className="card-heading">
            <Sparkles size={20} color="#c084fc" />
            Executive Synthesis
          </h3>
        </div>
        <p className="ai-summary-text">{aiReview.summary}</p>
        <p className="ai-explanation-text">{aiReview.explanation}</p>
      </div>

      {/* Recommended Optimizations */}
      <div className="dashboard-card">
        <div className="card-header-flex">
          <h3 className="card-heading">
            <Cpu size={20} color="#34d399" />
            Recommended Algorithmic Optimizations
          </h3>
          <span className="badge-count">{aiReview.optimizations.length} Proposed</span>
        </div>

        {aiReview.optimizations.length === 0 ? (
          <div className="clean-pane-state">
            <CheckCircle2 size={36} color="#10b981" />
            <p>Algorithm is already optimal for current scope.</p>
          </div>
        ) : (
          <div className="optimizations-list">
            {aiReview.optimizations.map((opt, idx) => (
              <div key={idx} className="optimization-card">
                <div className="opt-header">
                  <span className={`impact-badge ${opt.impact}`}>
                    {opt.impact.toUpperCase()} IMPACT
                  </span>
                  <h4 className="opt-title">{opt.title}</h4>
                </div>
                <p className="opt-desc">{opt.description}</p>

                {opt.beforeSnippet && opt.afterSnippet && (
                  <div className="diff-comparison-box">
                    <div className="diff-column before">
                      <div className="diff-header text-red">CURRENT IMPLEMENTATION</div>
                      <pre className="diff-pre font-mono"><code>{opt.beforeSnippet}</code></pre>
                    </div>
                    <div className="diff-column after">
                      <div className="diff-header text-green">RECOMMENDED REFACTOR</div>
                      <pre className="diff-pre font-mono"><code>{opt.afterSnippet}</code></pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Risks Checklist */}
      {aiReview.securityRisks.length > 0 && (
        <div className="dashboard-card">
          <div className="card-header-flex">
            <h3 className="card-heading text-red">
              <ShieldAlert size={20} color="#ef4444" />
              Security Vulnerabilities & Mitigations
            </h3>
          </div>
          <div className="security-risks-list">
            {aiReview.securityRisks.map((sec, i) => (
              <div key={i} className="security-risk-card">
                <div className="sec-risk-top">
                  <span className="sec-badge-critical">{sec.severity.toUpperCase()}</span>
                  <strong className="sec-title">{sec.name}</strong>
                  {sec.cwe && <span className="sec-cwe font-mono">{sec.cwe}</span>}
                </div>
                <p className="sec-desc">{sec.description}</p>
                <div className="sec-mitigation">
                  <strong>Mitigation:</strong> {sec.mitigation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
