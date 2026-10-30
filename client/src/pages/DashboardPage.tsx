import React, { useEffect, useState } from 'react';
import { 
  Play, 
  Activity, 
  AlertTriangle, 
  ShieldCheck, 
  FolderGit2, 
  ArrowUpRight, 
  CheckCircle2, 
  FileCode,
  Sparkles
} from 'lucide-react';
import { DashboardStats, SavedAnalysis } from '../shared/types';

interface DashboardPageProps {
  onNavigateToAnalyzer: (scan?: SavedAnalysis) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateToAnalyzer }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load dashboard stats:', err);
        setLoading(false);
      });
  }, []);

  const totalScans = stats?.totalScans || 14;
  const issuesDetected = (stats?.totalFindings.critical || 0) + (stats?.totalFindings.warning || 0);
  const healthScore = stats?.projectHealth || 92;
  const grade = stats?.grade || 'A';
  const recentRuns = stats?.recentScans || [];

  return (
    <div className="page-container">
      {/* Hero Header */}
      <div className="page-hero">
        <div>
          <h1 className="hero-title">Good morning, Developer.</h1>
          <p className="hero-subtitle">Understand your code. Improve your logic.</p>
        </div>
        <button className="btn-primary" onClick={() => onNavigateToAnalyzer()}>
          <Play size={14} fill="currentColor" /> Open Code Analyzer
        </button>
      </div>

      {/* 4 KPI Statistic Cards */}
      <div className="stats-grid-4">
        {/* Card 1: Total Analyses */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Total Analyses</span>
            <div className="stat-icon-wrapper">
              <Activity size={16} />
            </div>
          </div>
          <div className="stat-value">{totalScans}</div>
          <div className="stat-footer footer-emerald">
            <span>+3 new runs today</span>
          </div>
        </div>

        {/* Card 2: Issues Detected */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Issues Detected</span>
            <div className="stat-icon-wrapper">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="stat-value" style={{ color: issuesDetected > 0 ? 'var(--warning)' : 'var(--primary)' }}>
            {issuesDetected}
          </div>
          <div className="stat-footer footer-amber">
            <span>{stats?.totalFindings.critical || 0} critical vulnerabilities</span>
          </div>
        </div>

        {/* Card 3: Code Quality */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Code Quality</span>
            <div className="stat-icon-wrapper">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="stat-value footer-emerald">
            {healthScore}% <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Grade {grade}</span>
          </div>
          <div className="stat-footer footer-emerald">
            <span>Maintainability index: {stats?.avgMaintainability || 88}/100</span>
          </div>
        </div>

        {/* Card 4: Connected Projects */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Projects</span>
            <div className="stat-icon-wrapper">
              <FolderGit2 size={16} />
            </div>
          </div>
          <div className="stat-value">4</div>
          <div className="stat-footer footer-muted">
            <span>Active repositories connected</span>
          </div>
        </div>
      </div>

      {/* Middle Split: Recent Analysis Activity & Recent Projects */}
      <div className="dashboard-split-grid">
        {/* Left: Recent Activity Table & Telemetry */}
        <div className="panel-card">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Recent Analysis Activity</h2>
              <p className="panel-subtitle">Latest AST inspections, loop depths, and Big-O results</p>
            </div>
            <button 
              className="btn-secondary" 
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
              onClick={() => onNavigateToAnalyzer()}
            >
              Analyze New
            </button>
          </div>

          <div className="activity-table-wrapper">
            <table className="activity-table">
              <thead>
                <tr>
                  <th>Routine / File</th>
                  <th>Language</th>
                  <th>Time Complexity</th>
                  <th>Defects</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentRuns.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                      No recent activity. Click 'Open Code Analyzer' to run your first scan.
                    </td>
                  </tr>
                ) : (
                  recentRuns.map(run => (
                    <tr 
                      key={run.id} 
                      className="activity-row"
                      onClick={() => onNavigateToAnalyzer(run)}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontWeight: 500 }}>
                          <FileCode size={15} style={{ color: 'var(--primary)' }} />
                          <span>{run.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge-tag lang">{run.language.toUpperCase()}</span>
                      </td>
                      <td>
                        <span className="badge-tag complexity">{run.result.complexity.timeComplexity}</span>
                      </td>
                      <td>
                        <span style={{ 
                          color: run.result.findings.length > 0 ? 'var(--warning)' : 'var(--primary)',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          {run.result.findings.length} issue(s)
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary)', fontSize: '0.75rem' }}>
                          <CheckCircle2 size={13} /> Analyzed
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Minimalist Activity Telemetry Chart */}
          <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-muted)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>WEEKLY ANALYSIS VOLUME</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>Avg 18 runs/day</span>
            </div>
            <svg viewBox="0 0 500 60" style={{ width: '100%', height: '50px' }}>
              <polyline
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2"
                points="10,45 80,38 150,42 220,20 290,28 360,15 430,22 490,12"
              />
              <circle cx="490" cy="12" r="3" fill="var(--primary)" />
            </svg>
          </div>
        </div>

        {/* Right: Connected Projects & Quick Jumps */}
        <div className="panel-card">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Connected Projects</h2>
              <p className="panel-subtitle">Repositories synced for continuous inspection</p>
            </div>
          </div>

          <div className="projects-list">
            <div className="project-item" onClick={() => onNavigateToAnalyzer()}>
              <div>
                <div className="project-item-name">algorithms-core</div>
                <div className="project-item-meta">
                  <span>C++</span>
                  <span>•</span>
                  <span>Scanned 2h ago</span>
                </div>
              </div>
              <ArrowUpRight size={15} style={{ color: 'var(--text-muted)' }} />
            </div>

            <div className="project-item" onClick={() => onNavigateToAnalyzer()}>
              <div>
                <div className="project-item-name">auth-service-v2</div>
                <div className="project-item-meta">
                  <span>TypeScript</span>
                  <span>•</span>
                  <span>Scanned yesterday</span>
                </div>
              </div>
              <ArrowUpRight size={15} style={{ color: 'var(--text-muted)' }} />
            </div>

            <div className="project-item" onClick={() => onNavigateToAnalyzer()}>
              <div>
                <div className="project-item-name">data-pipeline-py</div>
                <div className="project-item-meta">
                  <span>Python</span>
                  <span>•</span>
                  <span>Scanned 3d ago</span>
                </div>
              </div>
              <ArrowUpRight size={15} style={{ color: 'var(--text-muted)' }} />
            </div>

            <div className="project-item" onClick={() => onNavigateToAnalyzer()}>
              <div>
                <div className="project-item-name">trading-engine</div>
                <div className="project-item-meta">
                  <span>Java</span>
                  <span>•</span>
                  <span>Scanned 4d ago</span>
                </div>
              </div>
              <ArrowUpRight size={15} style={{ color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div style={{ 
            marginTop: 'auto', 
            padding: '0.85rem', 
            backgroundColor: 'var(--primary-subtle)', 
            border: '1px solid var(--primary-border)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem'
          }}>
            <Sparkles size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
              Tip: You can import any public or private GitHub repository to inspect entire files in 1 click.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
