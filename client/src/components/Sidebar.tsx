import React from 'react';
import { 
  LayoutDashboard, 
  Code2, 
  History, 
  Github, 
  Settings, 
  LogOut, 
  LogIn, 
  Terminal,
  ShieldCheck
} from 'lucide-react';
import { User } from '../shared/types';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  user: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  setActivePage,
  user,
  onOpenAuth,
  onLogout,
  mobileOpen,
  onCloseMobile
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'analyzer', label: 'Code Analyzer', icon: Code2 },
    { id: 'history', label: 'Analysis History', icon: History },
    { id: 'github', label: 'GitHub Projects', icon: Github },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (id: string) => {
    setActivePage(id);
    onCloseMobile();
  };

  return (
    <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-link" onClick={() => handleNavClick('overview')}>
          <div className="brand-icon">
            <Terminal size={17} strokeWidth={2.2} />
          </div>
          <span className="brand-title">DevLens</span>
        </div>
        <span className="brand-badge">SaaS</span>
      </div>

      {/* Navigation List */}
      <nav className="sidebar-menu">
        <div className="menu-heading">Platform</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
            >
              <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} className="item-icon" />
              <span className="item-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile at Bottom */}
      <div className="sidebar-footer">
        {user ? (
          <div className="user-snippet">
            <div className="user-snippet-left">
              <div className="avatar-circle">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="user-meta">
                <span className="user-name-text">{user.name}</span>
                <span className="user-email-text">{user.email}</span>
              </div>
            </div>
            <button 
              className="btn-icon-subtle" 
              onClick={onLogout} 
              title="Sign Out"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button className="user-snippet" onClick={onOpenAuth} style={{ width: '100%', cursor: 'pointer' }}>
            <div className="user-snippet-left">
              <div className="avatar-circle">
                <LogIn size={13} />
              </div>
              <div className="user-meta">
                <span className="user-name-text">Sign In</span>
                <span className="user-email-text">Sync reports & settings</span>
              </div>
            </div>
          </button>
        )}
      </div>
    </aside>
  );
};
