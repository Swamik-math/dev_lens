import React, { useState } from 'react';
import { Settings, User as UserIcon, Sliders, Shield, Palette, Check } from 'lucide-react';
import { User } from '../shared/types';

interface SettingsPageProps {
  user: User | null;
  onOpenAuth: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ user, onOpenAuth }) => {
  const [activeSection, setActiveSection] = useState<'profile' | 'editor' | 'theme' | 'account'>('profile');
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <div className="page-container">
      <div className="page-hero">
        <div>
          <h1 className="hero-title">Platform Settings</h1>
          <p className="hero-subtitle">Manage your profile, editor defaults, and SaaS preferences.</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Navigation Sidebar for Settings */}
        <div className="settings-nav">
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

              <div className="form-row">
                <label className="form-label">Code Minimap</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem' }}>
                  <input type="checkbox" defaultChecked id="minimap-chk" />
                  <label htmlFor="minimap-chk" style={{ color: 'var(--text-secondary)' }}>Display minimap on the right edge</label>
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: 'fit-content' }}>
                Save Editor Preferences
              </button>
            </form>
          )}

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
                    <p style={{ marginTop: '0.35rem' }}>Session ID: <code style={{ color: 'var(--primary)' }}>{user.id}</code></p>
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
