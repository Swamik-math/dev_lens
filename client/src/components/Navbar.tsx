import React from 'react';
import { User, LogIn, Github, ExternalLink, Activity } from 'lucide-react';
import { User as UserType } from '../shared/types';

interface NavbarProps {
  activePage: string;
  user: UserType | null;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activePage, user, onOpenAuth }) => {
  const pageTitles: Record<string, string> = {
    dashboard: 'Developer Dashboard',
    editor: 'Code Editor & Analysis Workspace',
    complexity: 'Complexity & Big-O Engine',
    'static-analysis': 'Security Defect Inspector',
    'ai-review': 'AI Cognitive Code Review',
    github: 'GitHub Repository Importer',
    history: 'Analysis History & Reports'
  };

  return (
    <header className="top-navbar">
      <div className="navbar-breadcrumb">
        <span className="platform-prefix">DevLens</span>
        <span className="separator">/</span>
        <span className="current-page-crumb">{pageTitles[activePage] || 'Workspace'}</span>
      </div>

      <div className="navbar-actions">
        {/* Engine status indicator */}
        <div className="engine-status-badge">
          <span className="status-dot"></span>
          <span>Analysis Engine Active</span>
        </div>

        {/* User Account Button */}
        {user ? (
          <div className="nav-user-greeting">
            <span>Welcome, <strong>{user.name.split(' ')[0]}</strong></span>
          </div>
        ) : (
          <button className="btn-nav-auth" onClick={onOpenAuth}>
            <LogIn size={15} /> Sign In / Register
          </button>
        )}
      </div>
    </header>
  );
};
