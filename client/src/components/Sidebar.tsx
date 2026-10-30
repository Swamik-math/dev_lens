import React from 'react';
import { 
  LayoutDashboard, 
  Code2, 
  ShieldAlert, 
  Clock, 
  Sparkles, 
  Github, 
  History, 
  User as UserIcon, 
  LogOut,
  LogIn,
  ChevronRight
} from 'lucide-react';
import { User } from '../shared/types';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  user: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  setActivePage,
  user,
  onOpenAuth,
  onLogout
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Developer Dashboard', icon: LayoutDashboard },
    { id: 'editor', label: 'Code Editor', icon: Code2 },
    { id: 'complexity', label: 'Complexity Analysis', icon: Clock },
    { id: 'static-analysis', label: 'Security & Quality', icon: ShieldAlert },
    { id: 'ai-review', label: 'AI Code Review', icon: Sparkles },
    { id: 'github', label: 'GitHub Integration', icon: Github },
    { id: 'history', label: 'Analysis History', icon: History },
  ];

  return (
    <aside className="sidebar-container">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-logo-glow">
          <Code2 size={22} color="#fff" />
        </div>
        <div className="brand-text-block">
          <span className="brand-name">DevLens</span>
          <span className="brand-version">v2.4 • Platform</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">CORE WORKSPACE</div>
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActivePage(item.id)}
            >
              <Icon size={18} className="nav-icon" />
              <span className="nav-label">{item.label}</span>
              {isActive && <ChevronRight size={14} className="nav-arrow" />}
            </button>
          );
        })}
      </nav>

      {/* User Account / Profile Widget */}
      <div className="sidebar-user-section">
        {user ? (
          <div className="user-profile-card">
            <div className="user-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-email">{user.email}</span>
            </div>
            <button 
              className="btn-logout" 
              onClick={onLogout}
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button className="btn-login-prompt" onClick={onOpenAuth}>
            <div className="login-prompt-left">
              <div className="avatar-placeholder">
                <UserIcon size={16} />
              </div>
              <div className="login-prompt-text">
                <span className="login-title">Guest Developer</span>
                <span className="login-subtitle">Sign in to sync history</span>
              </div>
            </div>
            <LogIn size={16} color="#60a5fa" />
          </button>
        )}
      </div>
    </aside>
  );
};
