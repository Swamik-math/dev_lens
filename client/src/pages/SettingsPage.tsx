import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  Sliders, 
  Shield, 
  Palette, 
  Check, 
  Sparkles, 
  ExternalLink,
  Eye,
  EyeOff,
  Github,
  Key,
  RefreshCw,
  Lock,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { User, GitHubUserProfile } from '../shared/types';

interface SettingsPageProps {
  user: User | null;
  onOpenAuth: () => void;
  geminiApiKey: string;
  onSaveGeminiKey: (key: string) => void;
  githubToken: string;
  githubUsername: string;
  onSaveGitHub: (token: string, username: string) => void;
  onDisconnectGitHub: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ 
  user, 
  onOpenAuth,
  geminiApiKey,
  onSaveGeminiKey,
  githubToken,
  githubUsername,
  onSaveGitHub,
  onDisconnectGitHub
}) => {
  const [activeSection, setActiveSection] = useState<'gemini' | 'github' | 'profile' | 'editor' | 'theme' | 'account'>('gemini');
  const [savedNotice, setSavedNotice] = useState(false);
  
  // Gemini Key state
  const [keyInput, setKeyInput] = useState(geminiApiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // GitHub state
  const [tokenInput, setTokenInput] = useState(githubToken || '');
  const [usernameInput, setUsernameInput] = useState(githubUsername || '');
  const [showGitToken, setShowGitToken] = useState(false);
  const [testingGitHub, setTestingGitHub] = useState(false);
  const [gitHubProfile, setGitHubProfile] = useState<GitHubUserProfile | null>(null);
  const [gitHubMessage, setGitHubMessage] = useState<{ success: boolean; text: string } | null>(null);

  useEffect(() => {
    setKeyInput(geminiApiKey || '');
  }, [geminiApiKey]);

  useEffect(() => {
    setTokenInput(githubToken || '');
    setUsernameInput(githubUsername || '');
    if (githubToken || githubUsername) {
      fetchGitHubProfile(githubToken, githubUsername);
    }
  }, [githubToken, githubUsername]);

  const fetchGitHubProfile = async (tok?: string, usr?: string) => {
    try {
      let url = '/api/github/user';
      const params = new URLSearchParams();
      if (tok) params.append('token', tok);
      if (usr) params.append('username', usr);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (res.ok) {
        const data: GitHubUserProfile = await res.json();
        setGitHubProfile(data);
        if (!usr && data.login) {
          setUsernameInput(data.login);
        }
      }
    } catch {
      // Ignore background fetch failure
    }
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleSaveGemini = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = keyInput.trim();
    onSaveGeminiKey(cleanKey);

    setTestingKey(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/settings/gemini-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: cleanKey })
      });
      const data = await res.json();
      if (res.ok) {
        setTestResult({
          success: true,
          message: 'Gemini API Key saved and activated on DevLens!'
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Failed to activate key on server'
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'Could not connect to DevLens backend.'
      });
    } finally {
      setTestingKey(false);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    }
  };

  const handleConnectGitHub = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanToken = tokenInput.trim();
    const cleanUsername = usernameInput.trim();

    if (!cleanToken && !cleanUsername) {
      setGitHubMessage({
        success: false,
        text: 'Please provide either a GitHub Personal Access Token or a GitHub username.'
      });
      return;
    }

    setTestingGitHub(true);
    setGitHubMessage(null);

    try {
      let url = '/api/github/user';
      const params = new URLSearchParams();
      if (cleanToken) params.append('token', cleanToken);
      if (cleanUsername) params.append('username', cleanUsername);
      url += `?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to verify GitHub connection');
      }

      setGitHubProfile(data);
      onSaveGitHub(cleanToken, cleanUsername || data.login);
      setGitHubMessage({
        success: true,
        text: `Successfully connected to GitHub as @${data.login}!`
      });
    } catch (err: any) {
      setGitHubMessage({
        success: false,
        text: err.message || 'Error connecting to GitHub.'
      });
    } finally {
      setTestingGitHub(false);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    }
  };

  const handleDisconnect = () => {
    setTokenInput('');
    setUsernameInput('');
    setGitHubProfile(null);
    setGitHubMessage({
      success: true,
      text: 'GitHub account unlinked from DevLens.'
    });
    onDisconnectGitHub();
  };

  return (
    <div className="page-container">
      <div className="page-hero">
        <div>
          <h1 className="hero-title">Platform Settings</h1>
          <p className="hero-subtitle">Manage your profile, AI engine, GitHub sync, editor defaults, and SaaS preferences.</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Navigation Sidebar for Settings */}
        <div className="settings-nav">
          <button 
            className={`settings-nav-btn ${activeSection === 'gemini' ? 'active' : ''}`}
            onClick={() => setActiveSection('gemini')}
          >
            <Sparkles size={14} style={{ marginRight: '6px', display: 'inline', color: 'var(--primary)' }} /> Gemini AI Engine
          </button>
          <button 
            className={`settings-nav-btn ${activeSection === 'github' ? 'active' : ''}`}
            onClick={() => setActiveSection('github')}
          >
            <Github size={14} style={{ marginRight: '6px', display: 'inline', color: 'var(--text-main)' }} /> GitHub Connection
          </button>
          <button 
            className={`settings-nav-btn ${activeSection === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveSection('profile')}
          >
            <UserIcon size={14} style={{ marginRight: '6px', display: 'inline' }} /> Profile Details
          </button>
          <button 
            className={`settings-nav-btn ${activeSection === 'editor' ? 'active' : ''}`}
            onClick={() => setActiveSection('editor')}
          >
            <Sliders size={14} style={{ marginRight: '6px', display: 'inline' }} /> Editor Preferences
          </button>
          <button 
            className={`settings-nav-btn ${activeSection === 'theme' ? 'active' : ''}`}
            onClick={() => setActiveSection('theme')}
          >
            <Palette size={14} style={{ marginRight: '6px', display: 'inline' }} /> Theme & Aesthetics
          </button>
          <button 
            className={`settings-nav-btn ${activeSection === 'account' ? 'active' : ''}`}
            onClick={() => setActiveSection('account')}
          >
            <Shield size={14} style={{ marginRight: '6px', display: 'inline' }} /> Account & Security
          </button>
        </div>

        {/* Settings Panel Content */}
        <div className="settings-panel">
          {savedNotice && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              backgroundColor: 'var(--primary-subtle)', 
              border: '1px solid var(--primary-border)',
              color: 'var(--primary)',
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.78rem',
              marginBottom: '1rem'
            }}>
              <Check size={14} /> Preferences updated successfully.
            </div>
          )}

          {/* Gemini AI Settings */}
          {activeSection === 'gemini' && (
            <form onSubmit={handleSaveGemini} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="panel-header">
                <div>
                  <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={18} color="var(--primary)" /> Google Gemini API Integration
                  </h3>
                  <p className="panel-subtitle">
                    Supercharge DevLens with Gemini 2.5 Flash / 1.5 Flash for authoritative Big-O calculations and refactor diffs.
                  </p>
                </div>
              </div>

              <div style={{
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '1rem',
                fontSize: '0.8rem',
                lineHeight: 1.5,
                color: 'var(--text-secondary)'
              }}>
                <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>
                  How Gemini AI Works with DevLens:
                </strong>
                DevLens uses a dual-engine architecture:
                <ul style={{ paddingLeft: '1.2rem', marginTop: '0.35rem' }}>
                  <li><strong>Deterministic AST Engine:</strong> Instant local checks for loops, recursions, and code smells.</li>
                  <li><strong>Gemini AI Engine:</strong> Uses deep reasoning to calculate mathematically exact asymptotic complexities for complex data structures (HLD, Trees, Graphs, DP) and generate clean before/after code refactorings.</li>
                </ul>
              </div>

              <div className="form-row">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Google Gemini API Key</label>
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noreferrer"
                    style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--primary)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.25rem',
                      textDecoration: 'none'
                    }}
                  >
                    Get a free API Key from Google AI Studio <ExternalLink size={12} />
                  </a>
                </div>

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type={showKey ? 'text' : 'password'}
                    className="form-input" 
                    placeholder="AIzaSy..."
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    style={{ paddingRight: '2.5rem', fontFamily: 'monospace' }}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  Your key is saved locally in your browser and backend memory for seamless analysis.
                </span>
              </div>

              {testResult && (
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  backgroundColor: testResult.success ? 'var(--primary-subtle)' : 'var(--error-subtle)',
                  border: `1px solid ${testResult.success ? 'var(--primary-border)' : 'rgba(241, 109, 109, 0.3)'}`,
                  color: testResult.success ? 'var(--primary)' : 'var(--error)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  {testResult.success ? <Check size={16} /> : <AlertCircle size={16} />}
                  {testResult.message}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.5rem' }}>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={testingKey}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Sparkles size={14} />
                  {testingKey ? 'Activating Key...' : 'Save & Activate Gemini AI'}
                </button>

                {keyInput && (
                  <button 
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setKeyInput('');
                      onSaveGeminiKey('');
                      setTestResult({ success: false, message: 'Gemini Key removed. Falling back to deterministic engine.' });
                    }}
                  >
                    Remove Key
                  </button>
                )}
              </div>
            </form>
          )}

          {/* GitHub Connection Settings */}
          {activeSection === 'github' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="panel-header">
                <div>
                  <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Github size={18} color="var(--primary)" /> Link GitHub to DevLens
                  </h3>
                  <p className="panel-subtitle">
                    Connect your GitHub account to import repositories, browse file trees, and analyze codebase complexity with Gemini AI.
                  </p>
                </div>
              </div>

              {/* Active Profile Card if Connected */}
              {gitHubProfile && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1.25rem',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--primary-border)',
                  borderRadius: '8px',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img 
                      src={gitHubProfile.avatar_url} 
                      alt={gitHubProfile.login} 
                      style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid var(--primary)' }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>
                          {gitHubProfile.name || gitHubProfile.login}
                        </strong>
                        <span style={{ 
                          fontSize: '0.7rem', 
                          padding: '2px 8px', 
                          backgroundColor: 'var(--primary-subtle)', 
                          color: 'var(--primary)', 
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <ShieldCheck size={11} /> Connected
                        </span>
                      </div>
                      <a 
                        href={gitHubProfile.html_url} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                      >
                        @{gitHubProfile.login} <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {gitHubProfile.public_repos}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Public Repos</div>
                    </div>
                    {gitHubProfile.total_private_repos !== undefined && (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)' }}>
                          {gitHubProfile.total_private_repos}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Private Repos</div>
                      </div>
                    )}
                    <button 
                      onClick={handleDisconnect}
                      className="btn-danger-subtle"
                      style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
                    >
                      Unlink Account
                    </button>
                  </div>
                </div>
              )}

              {/* Instructions Guide */}
              <div style={{
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '1rem',
                fontSize: '0.8rem',
                lineHeight: 1.5,
                color: 'var(--text-secondary)'
              }}>
                <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '0.4rem' }}>
                  Two Ways to Link GitHub:
                </strong>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                  <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '0.25rem' }}>
                      <Key size={14} /> 1. Personal Access Token (Recommended)
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Enables full access to private repos, organizations, and 5,000 requests/hr rate limits.
                    </p>
                    <a 
                      href="https://github.com/settings/tokens/new?scopes=repo&description=DevLens%20Code%20Analyzer" 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--primary)', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.25rem',
                        marginTop: '0.5rem',
                        textDecoration: 'none',
                        fontWeight: 500
                      }}
                    >
                      Generate Token on GitHub (Pre-selected scopes) <ExternalLink size={11} />
                    </a>
                  </div>

                  <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)', fontWeight: 600, marginBottom: '0.25rem' }}>
                      <UserIcon size={14} /> 2. Public Username Only
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Zero setup required. Simply type any GitHub username (e.g. <code>supre</code>, <code>torvalds</code>) to browse public open-source repos.
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Input */}
              <form onSubmit={handleConnectGitHub} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-row">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>
                      GitHub Personal Access Token (Optional, for private repos)
                    </label>
                  </div>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input 
                      type={showGitToken ? 'text' : 'password'}
                      className="form-input" 
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_..."
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      style={{ paddingRight: '2.5rem', fontFamily: 'monospace' }}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowGitToken(!showGitToken)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      {showGitToken ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="form-row">
                  <label className="form-label">GitHub Username</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. supre, torvalds, facebook"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                  />
                </div>

                {gitHubMessage && (
                  <div style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    backgroundColor: gitHubMessage.success ? 'var(--primary-subtle)' : 'var(--error-subtle)',
                    border: `1px solid ${gitHubMessage.success ? 'var(--primary-border)' : 'rgba(241, 109, 109, 0.3)'}`,
                    color: gitHubMessage.success ? 'var(--primary)' : 'var(--error)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    {gitHubMessage.success ? <Check size={16} /> : <AlertCircle size={16} />}
                    {gitHubMessage.text}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.25rem' }}>
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    disabled={testingGitHub}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    {testingGitHub ? <RefreshCw size={14} className="spin" /> : <Github size={14} />}
                    {testingGitHub ? 'Connecting...' : (gitHubProfile ? 'Update GitHub Connection' : 'Connect & Verify GitHub')}
                  </button>

                  {gitHubProfile && (
                    <button 
                      type="button"
                      className="btn-secondary"
                      onClick={handleDisconnect}
                    >
                      Disconnect
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Profile Section */}
          {activeSection === 'profile' && (
            <form onSubmit={handleSavePreferences} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="panel-header">
                <div>
                  <h3 className="panel-title">Developer Profile</h3>
                  <p className="panel-subtitle">Personal information associated with your scan reports</p>
                </div>
              </div>

              <div className="form-row">
                <label className="form-label">Display Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  defaultValue={user ? user.name : 'Developer'} 
                />
              </div>

              <div className="form-row">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="form-input" 
                  defaultValue={user ? user.email : 'developer@devlens.io'} 
                  readOnly={!user}
                />
              </div>

              <div className="form-row">
                <label className="form-label">Linked GitHub Username</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="e.g. supre"
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: 'fit-content' }}>
                Save Profile Changes
              </button>
            </form>
          )}

          {/* Editor Preferences */}
          {activeSection === 'editor' && (
            <form onSubmit={handleSavePreferences} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="panel-header">
                <div>
                  <h3 className="panel-title">Monaco Editor Defaults</h3>
                  <p className="panel-subtitle">Configure your code editing canvas</p>
                </div>
              </div>

              <div className="form-row">
                <label className="form-label">Font Family</label>
                <input 
                  type="text" 
                  className="form-input" 
                  defaultValue="'Fira Code', monospace" 
                />
              </div>

              <div className="form-row">
                <label className="form-label">Font Size (px)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  defaultValue={14} 
                  min={10} 
                  max={24} 
                />
              </div>

              <div className="form-row">
                <label className="form-label">Tab Size</label>
                <select className="select-clean" style={{ maxWidth: '200px' }} defaultValue="2">
                  <option value="2">2 spaces</option>
                  <option value="4">4 spaces</option>
                </select>
              </div>

              <button type="submit" className="btn-primary" style={{ width: 'fit-content' }}>
                Save Editor Preferences
              </button>
            </form>
          )}

          {/* Theme Section */}
          {activeSection === 'theme' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="panel-header">
                <div>
                  <h3 className="panel-title">Theme & Aesthetics</h3>
                  <p className="panel-subtitle">Dark graphite SaaS palette with emerald accents</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div style={{ 
                  padding: '1rem', 
                  backgroundColor: 'var(--bg-main)', 
                  border: '2px solid var(--primary)', 
                  borderRadius: '8px' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--primary)' }}></div>
                    <strong style={{ fontSize: '0.85rem' }}>Dark Graphite & Emerald</strong>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                    Linear & Vercel developer aesthetic with #0B0F0D canvas and #42D995 accents.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Account Section */}
          {activeSection === 'account' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="panel-header">
                <div>
                  <h3 className="panel-title">Account & Security</h3>
                  <p className="panel-subtitle">Session credentials and token authentication</p>
                </div>
              </div>

              <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                {user ? (
                  <div>
                    <p>Signed in as: <strong style={{ color: 'var(--text-main)' }}>{user.email}</strong></p>
                    <p style={{ marginTop: '0.35rem' }}>User ID: <code style={{ color: 'var(--primary)' }}>{user.id}</code></p>
                  </div>
                ) : (
                  <div>
                    <p>You are currently operating in guest mode. Sign in to synchronize analyses across devices.</p>
                    <button className="btn-secondary" onClick={onOpenAuth} style={{ marginTop: '0.75rem' }}>
                      Sign In or Register
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
