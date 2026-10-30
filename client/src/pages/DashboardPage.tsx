import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  ShieldAlert, 
  Cpu, 
  Layers, 
  Clock, 
  Code2, 
  ArrowUpRight, 
  Play, 
  TrendingUp,
  FileCode,
  CheckCircle2
} from 'lucide-react';
import { DashboardStats, SavedAnalysis } from '../shared/types';

interface DashboardPageProps {
  onNavigateToEditor: (savedCode?: SavedAnalysis) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateToEditor }) => {
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

  if (loading || !stats) {
    return (
      <div className="page-loading-state">
        <Activity size={32} className="spin-icon text-accent" />
        <p>Loading developer metrics & codebase telemetry...</p>
      </div>
    );
  }

  const { projectHealth, grade, totalLoc, totalFindings, avgCyclomatic, avgMaintainability, recentScans } = stats;

  return (
    <div className="page-content dashboard-view">
      {/* Top Banner / Welcome */}
      <div className="dashboard-header-row">
        <div>
          <h1 className="page-title">Developer Telemetry & Health Dashboard</h1>
          <p className="page-subtitle">
            Continuous static analysis metrics, algorithm complexity distribution, and defect tracking.
          </p>
        </div>
        <button className="btn-primary" onClick={() => onNavigateToEditor()}>
          <Play size={16} fill="currentColor" /> Analyze New Code
        </button>
      </div>

      {/* Primary Analytics Grid (PhpCodeArcheology & Core Panel inspired) */}
      <div className="dashboard-metrics-grid">
        {/* Card 1: Project Health Gauge */}
        <div className="dashboard-card health-gauge-card">
          <div className="card-top-label">PROJECT HEALTH</div>
          <div className="gauge-container">
            <svg viewBox="0 0 100 55" className="gauge-svg">
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="#1e293b"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke={projectHealth >= 75 ? '#10b981' : projectHealth >= 50 ? '#f59e0b' : '#ef4444'}
                strokeWidth="10"
                strokeDasharray="125.6"
                strokeDashoffset={125.6 - (125.6 * (projectHealth / 100))}
                strokeLinecap="round"
              />
            </svg>
            <div className="gauge-number-overlay">
              <span className="gauge-val">{projectHealth}</span>
              <span className="gauge-grade">Grade {grade}</span>
            </div>
          </div>
          <div className="gauge-footer-text">
            {projectHealth >= 80 ? 'Robust architecture & low defect density' : 'Refactoring recommended for hot spots'}
          </div>
        </div>

        {/* Card 2: Codebase Footprint */}
        <div className="dashboard-card codebase-card">
          <div className="card-top-label">CODEBASE FOOTPRINT</div>
          <div className="metrics-subgrid">
            <div className="metric-box">
              <span className="sub-label">Lines of Code</span>
              <span className="sub-value">{totalLoc.toLocaleString()}</span>
            </div>
            <div className="metric-box">
              <span className="sub-label">Scanned Files</span>
              <span className="sub-value">{stats.totalScans}</span>
            </div>
            <div className="metric-box">
              <span className="sub-label">Maintainability</span>
              <span className="sub-value text-green">{avgMaintainability}/100</span>
            </div>
            <div className="metric-box">
              <span className="sub-label">Avg Cyclomatic</span>
              <span className="sub-value text-blue">{avgCyclomatic}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Defect & Problem Density */}
        <div className="dashboard-card problems-card">
          <div className="card-top-label">DEFECTS & PROBLEMS</div>
          <div className="problems-bar-container">
            <div className="problem-row">
              <span className="prob-label">Critical / Errors</span>
              <div className="prob-bar-wrapper">
                <div 
                  className="prob-bar-fill fill-red" 
                  style={{ width: `${Math.min(100, totalFindings.critical * 30 + 10)}%` }} 
                />
              </div>
              <span className="prob-count text-red">{totalFindings.critical}</span>
            </div>
            <div className="problem-row">
              <span className="prob-label">Warnings</span>
              <div className="prob-bar-wrapper">
                <div 
                  className="prob-bar-fill fill-amber" 
                  style={{ width: `${Math.min(100, totalFindings.warning * 20 + 15)}%` }} 
                />
              </div>
              <span className="prob-count text-amber">{totalFindings.warning}</span>
            </div>
            <div className="problem-row">
              <span className="prob-label">Informational</span>
              <div className="prob-bar-wrapper">
                <div 
                  className="prob-bar-fill fill-blue" 
                  style={{ width: `${Math.min(100, totalFindings.info * 20 + 20)}%` }} 
                />
              </div>
              <span className="prob-count text-blue">{totalFindings.info}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Row: Big-O Curves & Asymptotic Telemetry (Directly from Image 5) */}
      <div className="dashboard-middle-row">
        <div className="dashboard-card big-o-visual-card">
          <div className="card-header-flex">
            <div>
              <h3 className="card-heading">Big O Complexity Curves</h3>
              <p className="card-subtext">Asymptotic time scalability relative to input volume (n)</p>
            </div>
            <div className="complexity-badge-group">
              <span className="legend-chip chip-green">O(1)</span>
              <span className="legend-chip chip-yellow">O(log n)</span>
              <span className="legend-chip chip-blue">O(n)</span>
              <span className="legend-chip chip-red">O(n²)</span>
            </div>
          </div>

          {/* SVG Asymptotic Graph matching image 5 */}
          <div className="asymptotic-graph-wrapper">
            <svg viewBox="0 0 500 220" className="asymptotic-svg">
              {/* Axes */}
              <line x1="40" y1="20" x2="40" y2="190" stroke="#475569" strokeWidth="2" />
              <line x1="40" y1="190" x2="480" y2="190" stroke="#475569" strokeWidth="2" />
              
              {/* Axis labels */}
              <text x="15" y="100" fill="#94a3b8" fontSize="11" transform="rotate(-90 15 100)">Time →</text>
              <text x="230" y="210" fill="#94a3b8" fontSize="11">Input Size (n) →</text>

              {/* Curve O(1): Green horizontal */}
              <line x1="40" y1="165" x2="480" y2="165" stroke="#10b981" strokeWidth="3" />
              <text x="440" y="155" fill="#10b981" fontSize="12" fontWeight="700">O(1)</text>

              {/* Curve O(log n): Yellow sub-linear */}
              <path d="M 40 190 Q 150 145, 480 135" fill="none" stroke="#facc15" strokeWidth="3" />
              <text x="430" y="125" fill="#facc15" fontSize="12" fontWeight="700">O(log n)</text>

              {/* Curve O(n): Blue linear line */}
              <line x1="40" y1="190" x2="450" y2="60" stroke="#3b82f6" strokeWidth="3" />
              <text x="420" y="50" fill="#3b82f6" fontSize="12" fontWeight="700">O(n)</text>

              {/* Curve O(n^2): Red quadratic curve */}
              <path d="M 40 190 Q 160 180, 180 25" fill="none" stroke="#ef4444" strokeWidth="3" />
              <text x="150" y="20" fill="#ef4444" fontSize="12" fontWeight="700">O(n²)</text>
            </svg>
          </div>
        </div>

        {/* Recent Analysis Telemetry Runs */}
        <div className="dashboard-card recent-runs-card">
          <div className="card-header-flex">
            <h3 className="card-heading">Recent Analysis Runs</h3>
            <span className="badge-scans-count">{recentScans.length} Saved</span>
          </div>

          <div className="recent-runs-list">
            {recentScans.length === 0 ? (
              <p className="empty-subtext">No historical runs recorded. Analyze code to begin tracking.</p>
            ) : (
              recentScans.map(scan => (
                <div key={scan.id} className="run-item" onClick={() => onNavigateToEditor(scan)}>
                  <div className="run-item-left">
                    <FileCode size={18} className="run-icon" />
                    <div>
                      <div className="run-name">{scan.name}</div>
                      <div className="run-meta">
                        <span className="lang-tag">{scan.language.toUpperCase()}</span>
                        <span>•</span>
                        <span>{new Date(scan.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="run-item-right">
                    <span className="run-complexity-pill">{scan.result.complexity.timeComplexity}</span>
                    <ArrowUpRight size={16} className="run-arrow" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
