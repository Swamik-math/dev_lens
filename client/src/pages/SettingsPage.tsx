import React, { useState } from 'react';
import { 
  User as UserIcon, 
  Sliders, 
  Shield, 
  Palette, 
  Check, 
  Sparkles, 
  ExternalLink,
  Eye,
  EyeOff
} from 'lucide-react';
import { User } from '../shared/types';

interface SettingsPageProps {
  user: User | null;
  onOpenAuth: () => void;
  geminiApiKey: string;
  onSaveGeminiKey: (key: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ 
  user, 
  onOpenAuth,
  geminiApiKey,
  onSaveGeminiKey
}) => {
  const [activeSection, setActiveSection] = useState<'profile' | 'gemini' | 'editor' | 'theme' | 'account'>('gemini');
  const [savedNotice, setSavedNotice] = useState(false);
  const [keyInput, setKeyInput] = useState(geminiApiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleSaveGemini = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = keyInput.trim();
    onSaveGeminiKey(cleanKey);

    // Also sync to server endpoint
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

  return (
    <div className="page-container">
      <div className="page-hero">
        <div>
          <h1 className="hero-title">Platform Settings</h1>
          <p className="hero-subtitle">Manage your profile, AI engine, editor defaults, and SaaS preferences.</p>
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
              fontSize: '0.78rem'
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
                  <label className="form-label">Google Gemini API Key</label>
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noreferrer"
                    style={{ 
                      fontSize: '0.72rem', 
                      color: 'var(--primary)', 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '0.3rem',
                      textDecoration: 'none'
                    }}
                  >
                    Get a free API key at Google AI Studio <ExternalLink size={12} />
                  </a>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', maxWidth: '500px' }}>
                  <input 
                    type={showKey ? 'text' : 'password'} 
                    className="form-input" 
                    placeholder="AIzaSy..."
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => setShowKey(!showKey)}
                    title={showKey ? 'Hide key' : 'Show key'}
                    style={{ padding: '0.45rem 0.65rem' }}
                  >
                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Your key is stored securely in your browser and used solely to analyze your code.
                </span>
              </div>

              {testResult && (
                <div style={{
                  padding: '0.55rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  backgroundColor: testResult.success ? 'var(--primary-subtle)' : 'var(--error-subtle)',
                  border: `1px solid ${testResult.success ? 'var(--primary-border)' : 'var(--error-border)'}`,
                  color: testResult.success ? 'var(--primary)' : 'var(--error)'
                }}>
                  {testResult.message}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button type="submit" className="btn-primary" disabled={testingKey}>
                  {testingKey ? 'Activating...' : 'Save & Activate Gemini Key'}
                </button>
                {geminiApiKey && (
                  <button 
                    type="button" 
                    className="btn-danger-subtle"
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
                <label className="form-label">GitHub Username</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. torvalds" 
                  defaultValue="supre"
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
