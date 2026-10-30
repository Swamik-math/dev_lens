import React from 'react';
import { Search, Bell, Menu, User as UserIcon } from 'lucide-react';
import { User } from '../shared/types';

interface NavbarProps {
  activePage: string;
  user: User | null;
  onOpenAuth: () => void;
  onToggleMobileMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  user,
  onOpenAuth,
  onToggleMobileMenu
}) => {
  const pageTitles: Record<string, string> = {
    overview: 'Overview',
    analyzer: 'Code Analyzer',
    history: 'Analysis History',
    github: 'GitHub Projects',
    settings: 'Settings'
  };

  const title = pageTitles[activePage] || 'Workspace';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="menu-toggle-btn" onClick={onToggleMobileMenu} title="Toggle Menu">
          <Menu size={18} />
        </button>

        <div className="breadcrumbs">
          <span className="crumb-root">DevLens</span>
          <span className="crumb-separator">/</span>
          <span className="crumb-current">{title}</span>
        </div>
      </div>

      <div className="topbar-right">
        {/* Search Field */}
        <div className="search-box">
          <Search size={14} />
          <input type="text" placeholder="Search analyses, repos..." />
          <span className="shortcut-badge">⌘K</span>
        </div>

        {/* Engine Status */}
        <div className="engine-pill" title="AST static engine & Big-O analyzer ready">
          <span className="engine-dot"></span>
          <span>Engine ready</span>
        </div>

        {/* Notification Bell */}
        <button className="btn-icon-subtle" title="Notifications">
          <Bell size={16} />
        </button>

        {/* User avatar menu */}
        <button 
          className="avatar-circle" 
          onClick={onOpenAuth}
          title={user ? user.name : 'Sign In'}
          style={{ cursor: 'pointer' }}
        >
          {user ? user.name.charAt(0).toUpperCase() : <UserIcon size={14} />}
        </button>
      </div>
    </header>
  );
};
