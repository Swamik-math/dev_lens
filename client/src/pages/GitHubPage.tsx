import React, { useState, useEffect } from 'react';
import { 
  Github, 
  Search, 
  Star, 
  Folder, 
  FileCode, 
  Play, 
  ChevronRight, 
  Key,
  AlertCircle,
  ExternalLink,
  Lock,
  RefreshCw,
  Sliders,
  CheckCircle2,
  FolderOpen
} from 'lucide-react';
import { GitHubRepo, GitHubFile, GitHubUserProfile, SupportedLanguage } from '../shared/types';

interface GitHubPageProps {
  githubToken: string;
  githubUsername: string;
  onSaveGitHub: (token: string, username: string) => void;
  onDisconnectGitHub: () => void;
  onLoadCodeToEditor: (code: string, language: SupportedLanguage, fileName: string) => void;
  onOpenSettings: () => void;
}

export const GitHubPage: React.FC<GitHubPageProps> = ({ 
  githubToken,
  githubUsername,
  onSaveGitHub,
  onDisconnectGitHub,
  onLoadCodeToEditor,
  onOpenSettings
}) => {
  const [usernameInput, setUsernameInput] = useState(githubUsername || 'supre');
  const [tokenInput, setTokenInput] = useState(githubToken || '');
  const [showConnectForm, setShowConnectForm] = useState(!githubUsername && !githubToken);
  
  const [profile, setProfile] = useState<GitHubUserProfile | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [repoSearch, setRepoSearch] = useState('');
  const [repoFilter, setRepoFilter] = useState<'all' | 'public' | 'private'>('all');

  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [files, setFiles] = useState<GitHubFile[]>([]);
  const [pathBreadcrumbs, setPathBreadcrumbs] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingFileContent, setLoadingFileContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync state if props change
  useEffect(() => {
    if (githubUsername) setUsernameInput(githubUsername);
    if (githubToken) setTokenInput(githubToken);
    
    // Auto-fetch if credentials exist
    if (githubUsername || githubToken) {
      loadUserData(githubUsername, githubToken);
    }
  }, [githubUsername, githubToken]);

  const loadUserData = async (usr?: string, tok?: string) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch user profile
      let profileUrl = '/api/github/user';
      const params = new URLSearchParams();
      if (tok) params.append('token', tok);
      if (usr) params.append('username', usr);
      if (params.toString()) profileUrl += `?${params.toString()}`;

      const profRes = await fetch(profileUrl);
      if (profRes.ok) {
        const profData: GitHubUserProfile = await profRes.json();
        setProfile(profData);
      }

      // 2. Fetch repos
      let reposUrl = '/api/github/repos';
      const rParams = new URLSearchParams();
      if (tok) rParams.append('token', tok);
      if (usr) rParams.append('username', usr);
      if (rParams.toString()) reposUrl += `?${rParams.toString()}`;

      const res = await fetch(reposUrl);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch repositories');

      setRepos(data);
      setShowConnectForm(false);
    } catch (err: any) {
      setError(err.message || 'Error communicating with GitHub');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsr = usernameInput.trim();
    const cleanTok = tokenInput.trim();

    if (!cleanUsr && !cleanTok) {
      setError('Please provide a GitHub username or token.');
      return;
    }

    onSaveGitHub(cleanTok, cleanUsr);
    await loadUserData(cleanUsr, cleanTok);
  };

  const handleSelectRepo = async (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    setPathBreadcrumbs([]);
    setLoadingFiles(true);
    setError(null);

    try {
      const owner = repo.full_name.split('/')[0] || usernameInput || profile?.login || 'supre';
      let url = `/api/github/contents?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo.name)}`;
      if (githubToken) url += `&token=${encodeURIComponent(githubToken)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to list repository contents');

      setFiles(data);
    } catch (err: any) {
      setError(err.message || 'Error listing repository files');
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleNavigatePath = async (targetBreadcrumbIndex: number) => {
    if (!selectedRepo) return;
    const newBreadcrumbs = pathBreadcrumbs.slice(0, targetBreadcrumbIndex + 1);
    const targetPath = newBreadcrumbs.join('/');
    await fetchDirectoryContents(targetPath, newBreadcrumbs);
  };

  const handleNavigateRoot = async () => {
    if (!selectedRepo) return;
    await fetchDirectoryContents('', []);
  };

  const fetchDirectoryContents = async (path: string, newBreadcrumbs: string[]) => {
    if (!selectedRepo) return;
    setLoadingFiles(true);
    setError(null);

    try {
      const owner = selectedRepo.full_name.split('/')[0] || usernameInput || profile?.login || 'supre';
      let url = `/api/github/contents?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(selectedRepo.name)}&path=${encodeURIComponent(path)}`;
      if (githubToken) url += `&token=${encodeURIComponent(githubToken)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch directory contents');

      setFiles(data);
      setPathBreadcrumbs(newBreadcrumbs);
    } catch (err: any) {
      setError(err.message || 'Failed to read directory');
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleItemClick = async (item: GitHubFile) => {
    if (item.type === 'dir') {
      const newBreadcrumbs = [...pathBreadcrumbs, item.name];
      await fetchDirectoryContents(item.path, newBreadcrumbs);
      return;
    }

    if (!item.download_url) {
      setError('Cannot retrieve raw download URL for this file.');
      return;
    }

    setLoadingFileContent(item.name);
    try {
      const res = await fetch('/api/github/raw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ downloadUrl: item.download_url, token: githubToken })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to download file content');

      // Detect language from extension
      const ext = item.name.split('.').pop()?.toLowerCase();
      let detectedLang: SupportedLanguage = 'javascript';
      if (['cpp', 'cc', 'cxx', 'h', 'hpp', 'c'].includes(ext || '')) detectedLang = 'cpp';
      else if (['ts', 'tsx'].includes(ext || '')) detectedLang = 'typescript';
      else if (['py'].includes(ext || '')) detectedLang = 'python';
      else if (['java'].includes(ext || '')) detectedLang = 'java';

      // Load into editor and automatically navigate & trigger analysis
      onLoadCodeToEditor(data.content, detectedLang, item.name);
    } catch (err: any) {
      setError(err.message || 'Failed to load file content');
    } finally {
      setLoadingFileContent(null);
    }
  };

  // Filter repositories
  const filteredRepos = repos.filter(repo => {
    const matchesSearch = repo.name.toLowerCase().includes(repoSearch.toLowerCase()) ||
      (repo.language && repo.language.toLowerCase().includes(repoSearch.toLowerCase()));
    
    if (!matchesSearch) return false;
    if (repoFilter === 'public') return !repo.isPrivate;
    if (repoFilter === 'private') return Boolean(repo.isPrivate);
    return true;
  });

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-hero">
        <div>
          <h1 className="hero-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Github size={24} color="var(--primary)" /> GitHub Workspace
          </h1>
          <p className="hero-subtitle">
            Import repositories, explore project files, and run Gemini AI analysis on production code.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button 
            className="btn-secondary"
            onClick={() => loadUserData(usernameInput, githubToken)}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem' }}
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
            Refresh
          </button>
          <button 
            className="btn-secondary"
            onClick={onOpenSettings}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem' }}
          >
            <Sliders size={13} />
            GitHub Settings
          </button>
        </div>
      </div>

      {/* Connected Profile Bar or Connect Card */}
      {profile ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <img 
              src={profile.avatar_url} 
              alt={profile.login} 
              style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--primary)' }} 
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  {profile.name || profile.login}
                </strong>
                <span style={{ 
                  fontSize: '0.68rem', 
                  backgroundColor: 'var(--primary-subtle)', 
                  color: 'var(--primary)', 
                  padding: '2px 8px', 
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem'
                }}>
                  <CheckCircle2 size={11} /> Connected {githubToken ? 'via Token' : 'Public'}
                </span>
              </div>
              <a 
                href={profile.html_url} 
                target="_blank" 
                rel="noreferrer"
                style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
              >
                @{profile.login} <ExternalLink size={10} />
              </a>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              className="btn-icon-subtle" 
              onClick={() => setShowConnectForm(!showConnectForm)}
              style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}
            >
              {showConnectForm ? 'Hide Switch Account' : 'Switch GitHub User'}
            </button>
          </div>
        </div>
      ) : null}

      {/* Quick Connect Form (shown if requested or no credentials) */}
      {showConnectForm && (
        <div className="panel-card" style={{ marginBottom: '1.25rem', border: '1px solid var(--primary-border)' }}>
          <div className="panel-header">
            <div>
              <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Key size={15} color="var(--primary)" /> Connect GitHub Account
              </h3>
              <p className="panel-subtitle">Enter your GitHub username or Personal Access Token (for private repos)</p>
            </div>
          </div>

          <form onSubmit={handleConnectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>GitHub Username</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.35rem 0.65rem' }}>
                  <Github size={14} style={{ color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    placeholder="e.g. supre, torvalds, facebook"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '0.825rem', outline: 'none', width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 0 }}>
                    Personal Access Token (Optional)
                  </label>
                  <a 
                    href="https://github.com/settings/tokens/new?scopes=repo&description=DevLens%20Code%20Analyzer" 
                    target="_blank" 
                    rel="noreferrer"
                    style={{ fontSize: '0.7rem', color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                  >
                    Generate Token <ExternalLink size={10} />
                  </a>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.35rem 0.65rem' }}>
                  <Key size={14} style={{ color: 'var(--text-muted)' }} />
                  <input 
                    type="password" 
                    placeholder="ghp_... (enables private repos)"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '0.825rem', outline: 'none', width: '100%' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
              <button type="submit" className="btn-primary" disabled={loading} style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}>
                {loading ? 'Connecting...' : 'Connect Repositories'}
              </button>
              {profile && (
                <button type="button" className="btn-secondary" onClick={() => setShowConnectForm(false)} style={{ fontSize: '0.8rem' }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div style={{ 
          backgroundColor: 'var(--error-subtle)', 
          border: '1px solid rgba(241, 109, 109, 0.3)', 
          color: 'var(--error)', 
          padding: '0.65rem 1rem', 
          borderRadius: '6px', 
          fontSize: '0.8rem', 
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Two Column Layout: Left Repositories, Right Directory Files */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(420px, 1.4fr)', gap: '1.25rem', alignItems: 'start' }}>
        
        {/* Left: Repositories List */}
        <div className="panel-card">
          <div className="panel-header" style={{ marginBottom: '0.75rem' }}>
            <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Github size={15} /> Repositories ({filteredRepos.length})
            </h3>
          </div>

          {/* Search & Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.35rem 0.65rem' }}>
              <Search size={13} style={{ color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Filter repositories..."
                value={repoSearch}
                onChange={(e) => setRepoSearch(e.target.value)}
                style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '0.8rem', outline: 'none', width: '100%' }}
              />
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button 
                onClick={() => setRepoFilter('all')}
                style={{
                  fontSize: '0.72rem',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  backgroundColor: repoFilter === 'all' ? 'var(--primary-subtle)' : 'var(--bg-subtle)',
                  color: repoFilter === 'all' ? 'var(--primary)' : 'var(--text-secondary)',
                  border: `1px solid ${repoFilter === 'all' ? 'var(--primary-border)' : 'var(--border)'}`,
                  cursor: 'pointer'
                }}
              >
                All ({repos.length})
              </button>
              <button 
                onClick={() => setRepoFilter('public')}
                style={{
                  fontSize: '0.72rem',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  backgroundColor: repoFilter === 'public' ? 'var(--primary-subtle)' : 'var(--bg-subtle)',
                  color: repoFilter === 'public' ? 'var(--primary)' : 'var(--text-secondary)',
                  border: `1px solid ${repoFilter === 'public' ? 'var(--primary-border)' : 'var(--border)'}`,
                  cursor: 'pointer'
                }}
              >
                Public
              </button>
              <button 
                onClick={() => setRepoFilter('private')}
                style={{
                  fontSize: '0.72rem',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  backgroundColor: repoFilter === 'private' ? 'var(--primary-subtle)' : 'var(--bg-subtle)',
                  color: repoFilter === 'private' ? 'var(--primary)' : 'var(--text-secondary)',
                  border: `1px solid ${repoFilter === 'private' ? 'var(--primary-border)' : 'var(--border)'}`,
                  cursor: 'pointer'
                }}
              >
                Private {githubToken ? '' : '(Needs Token)'}
              </button>
            </div>
          </div>

          {/* Repository Cards */}
          {filteredRepos.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              <Folder size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }} />
              <p style={{ fontSize: '0.78rem' }}>No repositories found.</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '520px', overflowY: 'auto', paddingRight: '4px' }}>
            {filteredRepos.map(repo => {
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {repo.isPrivate ? <Lock size={12} color="var(--warning)" /> : null}
                      <strong style={{ fontSize: '0.85rem', color: isSelected ? 'var(--primary)' : 'var(--text-main)' }}>
                        {repo.name}
                      </strong>
                    </div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.72rem', color: 'var(--warning)' }}>
                      <Star size={11} fill="currentColor" /> {repo.stars}
                    </span>
                  </div>

                  {repo.description && (
                    <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {repo.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', fontSize: '0.7rem', alignItems: 'center' }}>
                    {repo.language && <span className="badge-tag lang">{repo.language}</span>}
                    <span style={{ color: 'var(--text-muted)' }}>branch: {repo.default_branch}</span>
                    {repo.isPrivate && (
                      <span style={{ color: 'var(--warning)', fontSize: '0.65rem' }}>Private</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Repository File Browser */}
        <div className="panel-card">
          <div className="panel-header" style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <FolderOpen size={16} color="var(--primary)" />
              <h3 className="panel-title" style={{ fontSize: '0.875rem' }}>
                {selectedRepo ? selectedRepo.name : 'Select a Repository'}
              </h3>
            </div>

            {selectedRepo && (
              <a 
                href={selectedRepo.html_url} 
                target="_blank" 
                rel="noreferrer"
                style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}
              >
                GitHub <ExternalLink size={11} />
              </a>
            )}
          </div>

          {!selectedRepo ? (
            <div style={{ textAlign: 'center', padding: '4rem 1.5rem', color: 'var(--text-muted)' }}>
              <Folder size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.25 }} />
              <p style={{ fontSize: '0.825rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>No Repository Selected</p>
              <p style={{ fontSize: '0.75rem' }}>Select a repository from the left panel to browse and analyze its code.</p>
            </div>
          ) : (
            <div>
              {/* Path Breadcrumbs */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: 'var(--bg-subtle)',
                padding: '0.4rem 0.65rem',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                marginBottom: '0.75rem',
                fontSize: '0.75rem',
                flexWrap: 'wrap'
              }}>
                <button 
                  onClick={handleNavigateRoot}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, fontWeight: 500 }}
                >
                  {selectedRepo.name}
                </button>
                {pathBreadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={idx}>
                    <ChevronRight size={11} color="var(--text-muted)" />
                    <button 
                      onClick={() => handleNavigatePath(idx)}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: idx === pathBreadcrumbs.length - 1 ? 'var(--text-main)' : 'var(--primary)', 
                        cursor: 'pointer', 
                        padding: 0,
                        fontWeight: idx === pathBreadcrumbs.length - 1 ? 600 : 400
                      }}
                    >
                      {crumb}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              {/* Files / Directory List */}
              {loadingFiles ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  <RefreshCw size={18} className="spin" style={{ margin: '0 auto 0.5rem' }} />
                  Loading files from GitHub...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '460px', overflowY: 'auto' }}>
                  {pathBreadcrumbs.length > 0 && (
                    <div 
                      onClick={() => handleNavigatePath(pathBreadcrumbs.length - 2)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.45rem 0.65rem',
                        backgroundColor: 'var(--bg-subtle)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      <Folder size={14} color="var(--primary)" />
                      <span>.. (Back to parent directory)</span>
                    </div>
                  )}

                  {files.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      No supported code files found in this directory.
                    </div>
                  )}

                  {files.map((file, i) => (
                    <div 
                      key={i}
                      onClick={() => handleItemClick(file)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0.65rem',
                        backgroundColor: 'var(--bg-subtle)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                        {file.type === 'dir' ? (
                          <Folder size={14} color="var(--primary)" />
                        ) : (
                          <FileCode size={14} color="var(--text-secondary)" />
                        )}
                        <span style={{ color: file.type === 'dir' ? 'var(--text-main)' : 'var(--text-secondary)', fontWeight: file.type === 'dir' ? 500 : 400 }}>
                          {file.name}
                        </span>
                      </div>

                      <div>
                        {file.type === 'dir' ? (
                          <ChevronRight size={13} color="var(--text-muted)" />
                        ) : (
                          <button 
                            className="btn-primary" 
                            disabled={loadingFileContent === file.name}
                            style={{ padding: '3px 8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            {loadingFileContent === file.name ? (
                              <RefreshCw size={10} className="spin" />
                            ) : (
                              <Play size={10} fill="currentColor" />
                            )}
                            {loadingFileContent === file.name ? 'Importing...' : 'Analyze with Gemini'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
