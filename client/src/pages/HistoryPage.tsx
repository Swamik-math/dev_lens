import React, { useEffect, useState } from 'react';
import { 
  History, 
  Trash2, 
  ArrowRight, 
  Clock, 
  ShieldAlert, 
  FileCode, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { SavedAnalysis } from '../shared/types';

interface HistoryPageProps {
  onLoadScan: (scan: SavedAnalysis) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onLoadScan }) => {
  const [history, setHistory] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = () => {
    fetch('/api/history')
      .then(res => res.json())
      .then(data => {
        setHistory(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load analysis history:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/history/${id}`, { method: 'DELETE' });
      setHistory(prev => prev.filter(h => h.id !== id));
    } catch (err) {
      console.error('Failed to delete report:', err);
    }
  };

  return (
    <div className="page-content history-view">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Analysis History & Saved Reports</h1>
          <p className="page-subtitle">
            Archive of historical complexity analyses, security defect findings, and regression records.
          </p>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="card-header-flex">
          <h3 className="card-heading">
            <History size={18} />
            Saved Analysis Runs
          </h3>
          <span className="badge-count">{history.length} Reports</span>
        </div>

        {loading ? (
          <div className="clean-pane-state">
            <p>Loading historical records...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="clean-pane-state">
            <History size={36} color="#64748b" />
            <h3>No Saved Analyses Yet</h3>
            <p>Run a scan in the Code Editor and click "Save Scan" to track reports over time.</p>
          </div>
        ) : (
          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Report Name</th>
                  <th>Language</th>
                  <th>Time Complexity</th>
                  <th>Auxiliary Space</th>
                  <th>Score</th>
                  <th>Findings</th>
                  <th>Date Saved</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} onClick={() => onLoadScan(item)} className="history-row">
                    <td>
                      <div className="report-name-cell">
                        <FileCode size={16} className="text-accent" />
                        <strong>{item.name}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="lang-tag">{item.language.toUpperCase()}</span>
                    </td>
                    <td>
                      <span className="complexity-chip font-mono">{item.result.complexity.timeComplexity}</span>
                    </td>
                    <td>
                      <span className="space-chip font-mono">{item.result.complexity.spaceComplexity}</span>
                    </td>
                    <td>
                      <span className={`score-badge ${item.result.complexity.score >= 80 ? 'text-green' : item.result.complexity.score >= 50 ? 'text-amber' : 'text-red'}`}>
                        {item.result.complexity.score}/100
                      </span>
                    </td>
                    <td>
                      <span className="findings-count-pill">{item.result.findings.length} issues</span>
                    </td>
                    <td className="date-cell">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="history-actions" onClick={e => e.stopPropagation()}>
                        <button 
                          className="btn-icon load" 
                          onClick={() => onLoadScan(item)}
                          title="Open in Code Editor"
                        >
                          <ArrowRight size={16} />
                        </button>
                        <button 
                          className="btn-icon delete" 
                          onClick={(e) => handleDelete(item.id, e)}
                          title="Delete Record"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
