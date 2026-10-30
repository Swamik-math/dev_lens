import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { DashboardPage } from './pages/DashboardPage';
import { EditorPage } from './pages/EditorPage';
import { HistoryPage } from './pages/HistoryPage';
import { GitHubPage } from './pages/GitHubPage';
import { SettingsPage } from './pages/SettingsPage';
import { AnalysisResult, SupportedLanguage, User, SavedAnalysis } from './shared/types';

const INITIAL_CODE = `// DevLens Sample: Nested loops in C++
#include <iostream>
using namespace std;

int main() {
    int n = 100;
    // TODO: Optimize this quadratic bottleneck
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            cout << i + j;
        }
    }
    return 0;
}`;

export function App() {
  const [activePage, setActivePage] = useState<string>('overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Core Analysis State (shared across all pages)
  const [code, setCode] = useState<string>(INITIAL_CODE);
  const [language, setLanguage] = useState<SupportedLanguage>('cpp');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Restore user session from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('devlens_user');
    const savedToken = localStorage.getItem('devlens_token');
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } catch (e) {
        localStorage.removeItem('devlens_user');
        localStorage.removeItem('devlens_token');
      }
    }

    // Auto-run analysis on initial code so telemetry metrics are populated
    runAnalysis(INITIAL_CODE, 'cpp');
  }, []);

  const handleAuthSuccess = (authUser: User, authToken: string) => {
    setUser(authUser);
    setToken(authToken);
    localStorage.setItem('devlens_user', JSON.stringify(authUser));
    localStorage.setItem('devlens_token', authToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('devlens_user');
    localStorage.removeItem('devlens_token');
  };

  const runAnalysis = async (codeToAnalyze = code, langToAnalyze = language) => {
    setLoading(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          code: codeToAnalyze,
          language: langToAnalyze,
          includeAi: true
        })
      });

      if (!res.ok) throw new Error('Analysis request failed');
      const data: AnalysisResult = await res.json();
      setResult(data);
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToHistory = async (name: string) => {
    if (!result) return;
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch('/api/analyze/save', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name,
          code,
          language,
          result
        })
      });
    } catch (err) {
      console.error('Failed to save to history:', err);
    }
  };

  const handleLoadScan = (scan: SavedAnalysis) => {
    setCode(scan.code);
    setLanguage(scan.language);
    setResult(scan.result);
    setActivePage('analyzer');
  };

  const handleLoadGitHubCode = (gitCode: string, gitLang: SupportedLanguage, fileName: string) => {
    setCode(gitCode);
    setLanguage(gitLang);
    setActivePage('analyzer');
    runAnalysis(gitCode, gitLang);
  };

  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Area */}
      <div className="main-wrapper">
        {/* Top Navigation */}
        <Navbar
          activePage={activePage}
          user={user}
          onOpenAuth={() => setAuthModalOpen(true)}
          onToggleMobileMenu={() => setMobileOpen(!mobileOpen)}
        />

        {/* Content Body Router */}
        <div className="content-area">
          {activePage === 'overview' && (
            <DashboardPage
              onNavigateToAnalyzer={(scan) => {
                if (scan) handleLoadScan(scan);
                else setActivePage('analyzer');
              }}
            />
          )}

          {activePage === 'analyzer' && (
            <EditorPage
              code={code}
              setCode={setCode}
              language={language}
              setLanguage={setLanguage}
              result={result}
              onRunAnalysis={() => runAnalysis(code, language)}
              loading={loading}
              onSaveToHistory={handleSaveToHistory}
            />
          )}

          {activePage === 'history' && (
            <HistoryPage
              onLoadScan={handleLoadScan}
            />
          )}

          {activePage === 'github' && (
            <GitHubPage
              onLoadCodeToEditor={handleLoadGitHubCode}
            />
          )}

          {activePage === 'settings' && (
            <SettingsPage
              user={user}
              onOpenAuth={() => setAuthModalOpen(true)}
            />
          )}
        </div>
      </div>

      {/* Auth Dialog */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default App;
