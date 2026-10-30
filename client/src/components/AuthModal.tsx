import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, AlertCircle, ArrowRight } from 'lucide-react';
import { User, AuthResponse } from '../shared/types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const body = isRegister ? { name, email, password } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      const authData = data as AuthResponse;
      onAuthSuccess(authData.user, authData.token);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog">
        <div className="modal-title-row">
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {isRegister ? 'Create DevLens Account' : 'Welcome to DevLens'}
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {isRegister ? 'Start analyzing code with persistent history' : 'Sign in to access your saved analyses'}
            </p>
          </div>
          <button className="btn-icon-subtle" onClick={onClose}><X size={16} /></button>
        </div>

        {error && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            backgroundColor: 'var(--error-subtle)', 
            border: '1px solid var(--error-border)', 
            color: 'var(--error)', 
            padding: '0.5rem 0.75rem', 
            borderRadius: '6px', 
            fontSize: '0.78rem' 
          }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {isRegister && (
            <div className="form-row">
              <label className="form-label">Full Name</label>
              <input 
                className="form-input" 
                type="text" 
                required 
                placeholder="Alex Developer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ maxWidth: '100%' }}
              />
            </div>
          )}

          <div className="form-row">
            <label className="form-label">Email Address</label>
            <input 
              className="form-input" 
              type="email" 
              required 
              placeholder="alex@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ maxWidth: '100%' }}
            />
          </div>

          <div className="form-row">
            <label className="form-label">Password</label>
            <input 
              className="form-input" 
              type="password" 
              required 
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ maxWidth: '100%' }}
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
          >
            {loading ? 'Processing...' : (isRegister ? 'Create Account' : 'Sign In')}
            <ArrowRight size={15} />
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {isRegister ? (
            <span>
              Already have an account?{' '}
              <button 
                onClick={() => setIsRegister(false)} 
                style={{ color: 'var(--primary)', fontWeight: 500, textDecoration: 'underline' }}
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              New to DevLens?{' '}
              <button 
                onClick={() => setIsRegister(true)} 
                style={{ color: 'var(--primary)', fontWeight: 500, textDecoration: 'underline' }}
              >
                Create an account
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
