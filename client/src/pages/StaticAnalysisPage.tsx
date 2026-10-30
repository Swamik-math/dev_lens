import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertOctagon, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  FileCode, 
  Bug, 
  Lock, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { AnalysisResult, Finding, FindingSeverity } from '../shared/types';

interface StaticAnalysisPageProps {
  result: AnalysisResult | null;
  onNavigateToEditor: () => void;
}

export const StaticAnalysisPage: React.FC<StaticAnalysisPageProps> = ({ result, onNavigateToEditor }) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);

  if (!result) {
    return (
      <div className="page-empty-state">
        <ShieldAlert size={48} className="empty-icon text-muted" />
        <h2>No Active Analysis</h2>
        <p>Run a code scan in the Code Editor to inspect security vulnerabilities, bug risks, and quality defects.</p>
        <button className="btn-primary" onClick={onNavigateToEditor}>
          Go to Code Editor
        </button>
      </div>
    );
  }

  const { findings, metrics } = result;

  const filteredFindings = findings.filter(f => {
    if (selectedSeverity === 'all') return true;
    return f.severity === selectedSeverity;
  });

  const activeFinding = selectedFinding || (filteredFindings.length > 0 ? filteredFindings[0] : null);

  const criticalCount = findings.filter(f => f.severity === 'critical').length;
  const warningCount = findings.filter(f => f.severity === 'warning').length;
  const infoCount = findings.filter(f => f.severity === 'info').length;

  return (
    <div className="page-content defect-inspector-view">
      {/* Top Header */}
      <div className="defect-header">
        <div>
          <h1 className="page-title">Static Code Analysis & Security Defect Inspector</h1>
          <p className="page-subtitle">
            AST-level deterministic defect detection, CWE security mappings, and code quality audits.
          </p>
        </div>

        {/* Severity Quick Filters */}
        <div className="filter-pill-group">
          <button 
            className={`filter-pill ${selectedSeverity === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedSeverity('all')}
          >
            All Issues ({findings.length})
          </button>
          <button 
            className={`filter-pill red ${selectedSeverity === 'critical' ? 'active' : ''}`}
            onClick={() => setSelectedSeverity('critical')}
          >
            Critical ({criticalCount})
          </button>
          <button 
            className={`filter-pill amber ${selectedSeverity === 'warning' ? 'active' : ''}`}
            onClick={() => setSelectedSeverity('warning')}
          >
            Warnings ({warningCount})
          </button>
          <button 
            className={`filter-pill blue ${selectedSeverity === 'info' ? 'active' : ''}`}
            onClick={() => setSelectedSeverity('info')}
          >
            Info ({infoCount})
          </button>
        </div>
      </div>

      {/* Main 2-Column Inspector (Svace style: Image 4) */}
      <div className="defect-layout-grid">
        {/* Left Column: Finding Defect List */}
        <div className="defect-list-pane">
          <div className="pane-header">
            <span>DEFECT LOG • {filteredFindings.length} ITEMS</span>
          </div>

          {filteredFindings.length === 0 ? (
            <div className="clean-pane-state">
              <CheckCircle2 size={36} color="#10b981" />
              <h3>Zero Defects Found</h3>
              <p>No issues matching this severity filter.</p>
            </div>
          ) : (
            <div className="defect-items-scroll">
              {filteredFindings.map((finding) => {
                const isSelected = activeFinding?.id === finding.id;
                return (
                  <div 
                    key={finding.id} 
                    className={`defect-row ${finding.severity} ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedFinding(finding)}
                  >
                    <div className="defect-row-top">
                      <span className={`badge-severity ${finding.severity}`}>
                        {finding.severity}
                      </span>
                      <span className="defect-line">Line {finding.line}</span>
                      <span className="defect-category">[{finding.category}]</span>
                    </div>
                    <div className="defect-message">
                      {finding.message}
                    </div>
                    {finding.snippet && (
                      <div className="defect-mini-snippet font-mono">
                        {finding.snippet}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Deep Defect Inspector Card (Image 4 inspired) */}
        <div className="defect-inspector-pane">
          {activeFinding ? (
            <div className="inspector-card">
              {/* Defect Title & Rule ID */}
              <div className="inspector-card-header">
                <div>
                  <span className="inspector-rule-tag">{activeFinding.ruleId}</span>
                  <h2 className="inspector-title">{activeFinding.message}</h2>
                </div>
                <span className={`severity-tag-large ${activeFinding.severity}`}>
                  {activeFinding.severity.toUpperCase()}
                </span>
              </div>

              {/* CWE & Metadata */}
              <div className="inspector-meta-bar">
                <div className="meta-item">
                  <span className="meta-label">Category:</span>
                  <span className="meta-val capitalize">{activeFinding.category}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Line Number:</span>
                  <span className="meta-val font-mono">{activeFinding.line}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Security Standard:</span>
                  <span className="meta-val font-mono text-accent">
                    {activeFinding.category === 'security' ? 'CWE-94 / OWASP Top 10' : 'Clean Code Best Practice'}
                  </span>
                </div>
              </div>

              {/* Offending Code Snippet */}
              {activeFinding.snippet && (
                <div className="inspector-section">
                  <span className="section-label">DETECTED CODE PATTERN</span>
                  <pre className="code-snippet-box font-mono">
                    <code>{`Line ${activeFinding.line} │ ${activeFinding.snippet}`}</code>
                  </pre>
                </div>
              )}

              {/* Technical Description / Root Cause */}
              <div className="inspector-section">
                <span className="section-label">TECHNICAL EXPLANATION & EXPLOIT TRACE</span>
                <p className="inspector-text">
                  {activeFinding.explanation}
                </p>
              </div>

              {/* Remediation / Fix Recommendation */}
              {activeFinding.suggestion && (
                <div className="inspector-section remediation-box">
                  <div className="remediation-title">
                    <Sparkles size={16} color="#10b981" />
                    <span>RECOMMENDED REMEDIATION</span>
                  </div>
                  <p className="remediation-text">
                    {activeFinding.suggestion}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="clean-pane-state">
              <Info size={36} color="#60a5fa" />
              <h3>Select a Defect</h3>
              <p>Click on any issue in the defect list to inspect the complete AST trace and remediation advice.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
