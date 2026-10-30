import React, { useState } from 'react';
import { 
  Github, 
  Search, 
  Star, 
  Folder, 
  FileCode, 
  Play, 
  ChevronRight, 
  Key,
  AlertCircle
} from 'lucide-react';
import { GitHubRepo, GitHubFile, SupportedLanguage } from '../shared/types';

interface GitHubPageProps {
  onLoadCodeToEditor: (code: string, language: SupportedLanguage, fileName: string) => void;
}

export const GitHubPage: React.FC<GitHubPageProps> = ({ onLoadCodeToEditor }) => {
  const [username, setUsername] = useState('supre');
  const [token, setToken] = useState('');
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [files, setFiles] = useState<GitHubFile[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);

  const handleFetchRepos = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError(null);
    setSelectedRepo(null);
    setFiles([]);

    try {
      const url = `/api/github/repos?username=${encodeURIComponent(username)}${token ? `&token=${encodeURIComponent(token)}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch repositories');
      }

      setRepos(data);
    } catch (err: any) {
      setError(err.message || 'Error communicating with GitHub API');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRepo = async (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    setCurrentPath('');
    setLoading(true);
    setError(null);

    try {
      const url = `/api/github/contents?owner=${encodeURIComponent(username)}&repo=${encodeURIComponent(repo.name)}${token ? `&token=${encodeURIComponent(token)}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to list repository contents');
      }

      setFiles(data);
    } catch (err: any) {
      setError(err.message || 'Error listing repository files');
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = async (file: GitHubFile) => {
    if (file.type === 'dir') {
      setCurrentPath(file.path);
      setLoading(true);
      try {
        const url = `/api/github/contents?owner=${encodeURIComponent(username)}&repo=${encodeURIComponent(selectedRepo!.name)}&path=${encodeURIComponent(file.path)}${token ? `&token=${encodeURIComponent(token)}` : ''}`;
        const res = await fetch(url);
        const data = await res.json();
        setFiles(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!file.download_url) return;

    setLoadingFile(true);
    try {
      const res = await fetch('/api/github/raw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ downloadUrl: file.download_url, token })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const ext = file.name.split('.').pop()?.toLowerCase();
      let detectedLang: SupportedLanguage = 'javascript';
      if (['cpp', 'cc', 'cxx', 'h', 'hpp', 'c'].includes(ext || '')) detectedLang = 'cpp';
      else if (['ts', 'tsx'].includes(ext || '')) detectedLang = 'typescript';
      else if (['py'].includes(ext || '')) detectedLang = 'python';
      else if (['java'].includes(ext || '')) detectedLang = 'java';

      onLoadCodeToEditor(data.content, detectedLang, file.name);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch raw file');
    } finally {
      setLoadingFile(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-hero">
        <div>
          <h1 className="hero-title">GitHub Projects</h1>
          <p className="hero-subtitle">Import repositories, browse file trees, and inspect codebase complexity.</p>
        </div>
      </div>

      {/* Query Bar */}
      <div className="panel-card" style={{ padding: '1rem' }}>
        <form onSubmit={handleFetchRepos} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.35rem 0.65rem', flex: 1, minWidth: '220px' }}>
            <Github size={15} style={{ color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="GitHub handle or organization (e.g. torvalds, facebook, supre)..." 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '0.8rem', outline: 'none', width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.35rem 0.65rem', width: '220px' }}>
            <Key size={14} style={{ color: 'var(--text-muted)' }} />
            <input 
              type="password" 
              placeholder="Optional token..." 
              value={token}
              onChange={(e) => setToken(e.target.value)}
              style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '0.8rem', outline: 'none', width: '100%' }}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            <Search size={14} /> {loading ? 'Fetching...' : 'Find Repositories'}
          </button>
        </form>

        {error && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            backgroundColor: 'var(--error-subtle)', 
            border: '1px solid var(--error-border)', 
            color: 'var(--error)', 
            padding: '0.45rem 0.65rem', 
            borderRadius: '6px', 
            fontSize: '0.75rem', 
            marginTop: '0.75rem' 
          }}>
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Repositories & File Explorer Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Left: Repositories */}
        <div className="panel-card">
          <div className="panel-header">
            <h3 className="panel-title">
              <Github size={16} /> Repositories ({repos.length})
            </h3>
          </div>

          {repos.length === 0 && !loading && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              No repositories loaded yet. Search a GitHub handle above.
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '450px', overflowY: 'auto' }}>
            {repos.map(repo => {
              const isSelected = selectedRepo?.id === repo.id;
              return (
                <div 
                  key={repo.id}
                  onClick={() => handleSelectRepo(repo)}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: isSelected ? 'var(--bg-hover)' : 'var(--bg-subtle)',
                    border: `1px solid ${isSelected ? 'var(--primary-border)' : 'var(--border)'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{repo.name}</strong>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', color: 'var(--warning)' }}>
                      <Star size={12} fill="currentColor" /> {repo.stars}
                    </span>
                  </div>
                  {repo.description && (
                    <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                      {repo.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', fontSize: '0.7rem' }}>
                    {repo.language && <span className="badge-tag lang">{repo.language}</span>}
                    <span style={{ color: 'var(--text-muted)' }}>branch: {repo.default_branch}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Files */}
        <div className="panel-card">
          <div className="panel-header">
            <h3 className="panel-title">
              <Folder size={16} style={{ color: 'var(--primary)' }} /> 
              {selectedRepo ? `${selectedRepo.name} ${currentPath ? `/ ${currentPath}` : ''}` : 'Repository Files'}
            </h3>
            {loadingFile && <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>Importing code...</span>}
          </div>

          {!selectedRepo ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <Folder size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }} />
              <p style={{ fontSize: '0.78rem' }}>Select a repository on the left to inspect files.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '450px', overflowY: 'auto' }}>
              {files.map((file, i) => (
                <div 
                  key={i}
                  onClick={() => handleFileClick(file)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.65rem',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                    {file.type === 'dir' ? (
                      <Folder size={14} color="var(--primary)" />
                    ) : (
                      <FileCode size={14} color="var(--text-secondary)" />
                    )}
                    <span>{file.name}</span>
                  </div>
                  <div>
                    {file.type === 'dir' ? (
                      <ChevronRight size={13} color="var(--text-muted)" />
                    ) : (
                      <span className="btn-primary" style={{ padding: '2px 7px', fontSize: '0.7rem' }}>
                        <Play size={10} fill="currentColor" /> Analyze
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
