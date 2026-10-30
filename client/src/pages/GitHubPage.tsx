import React, { useState } from 'react';
import { 
  Github, 
  Search, 
  Star, 
  Folder, 
  FileCode, 
  ArrowRight, 
  ExternalLink, 
  Key, 
  Play, 
  ChevronRight,
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
      // Browse directory
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

    // It's a code file: fetch raw content
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

      // Detect language from extension
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
    <div className="page-content github-view">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">GitHub Repository Integration & Code Importer</h1>
          <p className="page-subtitle">
            Connect public or private repositories, browse file trees, and load code directly into DevLens.
          </p>
        </div>
      </div>

      {/* GitHub Query Controls */}
      <div className="dashboard-card github-query-card">
        <form onSubmit={handleFetchRepos} className="github-search-form">
          <div className="search-input-group">
            <Github size={20} className="search-icon" />
            <input 
              type="text" 
              placeholder="Enter GitHub username or organization (e.g. torvalds, facebook, supre)..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="github-text-input"
            />
          </div>

          <div className="token-input-group">
            <Key size={16} className="token-icon" />
            <input 
              type="password" 
              placeholder="Optional: GitHub Personal Access Token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="github-token-input"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            <Search size={16} />
            {loading ? 'Fetching...' : 'Find Repositories'}
          </button>
        </form>

        {error && (
          <div className="github-error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* 2-Column Split: Repositories on left, File Explorer on right */}
      <div className="github-browser-grid">
        {/* Left: Repositories List */}
        <div className="dashboard-card repo-list-card">
          <div className="card-header-flex">
            <h3 className="card-heading">
              <Github size={18} />
              Repositories for @{username}
            </h3>
            <span className="badge-count">{repos.length} Found</span>
          </div>

          {repos.length === 0 && !loading && (
            <p className="empty-subtext">No repositories loaded yet. Search a GitHub handle above.</p>
          )}

          <div className="repo-items-list">
            {repos.map((repo) => {
              const isSelected = selectedRepo?.id === repo.id;
              return (
                <div 
                  key={repo.id} 
                  className={`repo-card-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectRepo(repo)}
                >
                  <div className="repo-card-top">
                    <span className="repo-title">{repo.name}</span>
                    <span className="repo-stars">
                      <Star size={13} fill="currentColor" /> {repo.stars}
                    </span>
                  </div>
                  {repo.description && (
                    <p className="repo-desc">{repo.description}</p>
                  )}
                  <div className="repo-meta">
                    {repo.language && <span className="lang-tag">{repo.language}</span>}
                    <span className="branch-tag">branch: {repo.default_branch}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: File Explorer */}
        <div className="dashboard-card file-explorer-card">
          <div className="card-header-flex">
            <h3 className="card-heading">
              <Folder size={18} color="#f59e0b" />
              {selectedRepo ? `${selectedRepo.name} ${currentPath ? `/ ${currentPath}` : ''}` : 'File Explorer'}
            </h3>
            {loadingFile && <span className="text-accent">Loading code into editor...</span>}
          </div>

          {!selectedRepo ? (
            <div className="clean-pane-state">
              <Folder size={36} color="#475569" />
              <p>Select a repository on the left to inspect its file directory.</p>
            </div>
          ) : (
            <div className="files-list-tree">
              {files.map((file, i) => (
                <div 
                  key={i} 
                  className="file-node-row"
                  onClick={() => handleFileClick(file)}
                >
                  <div className="file-node-left">
                    {file.type === 'dir' ? (
                      <Folder size={16} color="#fbbf24" />
                    ) : (
                      <FileCode size={16} color="#60a5fa" />
                    )}
                    <span className="file-node-name">{file.name}</span>
                  </div>
                  <div className="file-node-right">
                    {file.type === 'dir' ? (
                      <ChevronRight size={14} color="#64748b" />
                    ) : (
                      <span className="btn-import-code">
                        <Play size={12} fill="currentColor" /> Analyze
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
