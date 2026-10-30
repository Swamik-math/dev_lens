import React, { useEffect, useState } from 'react';
import { History, FileCode, Trash2, ArrowRight, Clock } from 'lucide-react';
import { SavedAnalysis } from '../shared/types';

interface HistoryPageProps {
  onLoadScan: (scan: SavedAnalysis) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onLoadScan }) => {
  const [history, setHistory] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    <div className="page-container">
      <div className="page-hero">
        <div>
          <h1 className="hero-title">Analysis History</h1>
          <p className="hero-subtitle">Archive of past code inspections, time complexity benchmarks, and detected defects.</p>
        </div>
      </div>

      <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="panel-title">
            <History size={16} /> Past Analysis Runs
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{history.length} records</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Loading saved reports...
          </div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
            <FileCode size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }} />
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>No saved analyses yet</h4>
            <p style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>Run a scan in the Code Analyzer and click 'Save Scan' to persist reports here.</p>
          </div>
        ) : (
          <div className="activity-table-wrapper">
            <table className="activity-table">
              <thead>
                <tr>
                  <th>File / Report Name</th>
                  <th>Language</th>
                  <th>Time Complexity</th>
                  <th>Space</th>
                  <th>Defects</th>
                  <th>Saved Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map(item => (
                  <tr 
                    key={item.id} 
                    className="activity-row"
                    onClick={() => onLoadScan(item)}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, color: 'var(--text-main)' }}>
                        <FileCode size={15} color="var(--primary)" />
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge-tag lang">{item.language.toUpperCase()}</span>
                    </td>
                    <td>
                      <span className="badge-tag complexity">{item.result.complexity.timeComplexity}</span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {item.result.complexity.spaceComplexity}
                      </span>
                    </td>
                    <td>
                      <span style={{ 
                        color: item.result.findings.length > 0 ? 'var(--warning)' : 'var(--primary)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.78rem'
                      }}>
                        {item.result.findings.length} issue(s)
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }} onClick={e => e.stopPropagation()}>
                        <button 
                          className="btn-icon-subtle" 
                          onClick={() => onLoadScan(item)}
                          title="Open in Code Analyzer"
                        >
                          <ArrowRight size={14} />
                        </button>
                        <button 
                          className="btn-icon-subtle" 
                          onClick={(e) => handleDelete(item.id, e)}
                          title="Delete report"
                        >
                          <Trash2 size={14} color="var(--error)" />
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
