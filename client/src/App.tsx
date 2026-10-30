import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { DashboardPage } from './pages/DashboardPage';
import { EditorPage } from './pages/EditorPage';
import { StaticAnalysisPage } from './pages/StaticAnalysisPage';
import { ComplexityPage } from './pages/ComplexityPage';
import { AiReviewPage } from './pages/AiReviewPage';
import { GitHubPage } from './pages/GitHubPage';
import { HistoryPage } from './pages/HistoryPage';
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
  const [activePage, setActivePage] = useState<string>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Core Analysis State (shared across all pages)
  const [code, setCode] = useState<string>(INITIAL_CODE);
  const [language, setLanguage] = useState<SupportedLanguage>('cpp');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Restore session from localStorage on mount
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

    // Auto-run analysis on initial code so all tabs have rich telemetry ready
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

  // Navigators & Importers
  const handleLoadScan = (scan: SavedAnalysis) => {
    setCode(scan.code);
    setLanguage(scan.language);
    setResult(scan.result);
    setActivePage('editor');
  };

  const handleLoadGitHubCode = (gitCode: string, gitLang: SupportedLanguage, fileName: string) => {
    setCode(gitCode);
    setLanguage(gitLang);
    setActivePage('editor');
    runAnalysis(gitCode, gitLang);
  };

  return (
    <div className="devlens-app-shell">
      {/* Left Sidebar */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Viewport */}
      <div className="main-viewport">
        {/* Top Navbar */}
        <Navbar
          activePage={activePage}
          user={user}
          onOpenAuth={() => setAuthModalOpen(true)}
        />

        {/* Page Content Switcher */}
        <main className="page-body-container">
          {activePage === 'dashboard' && (
            <DashboardPage
              onNavigateToEditor={(scan) => {
                if (scan) handleLoadScan(scan);
                else setActivePage('editor');
              }}
            />
          )}

          {activePage === 'editor' && (
            <EditorPage
              code={code}
              setCode={setCode}
              language={language}
              setLanguage={setLanguage}
              result={result}
              setResult={setResult}
              onRunAnalysis={() => runAnalysis(code, language)}
              loading={loading}
              onSaveToHistory={handleSaveToHistory}
            />
          )}

          {activePage === 'complexity' && (
            <ComplexityPage
              result={result}
              onNavigateToEditor={() => setActivePage('editor')}
            />
          )}

          {activePage === 'static-analysis' && (
            <StaticAnalysisPage
              result={result}
              onNavigateToEditor={() => setActivePage('editor')}
            />
          )}

          {activePage === 'ai-review' && (
            <AiReviewPage
              result={result}
              onNavigateToEditor={() => setActivePage('editor')}
            />
          )}

          {activePage === 'github' && (
            <GitHubPage
              onLoadCodeToEditor={handleLoadGitHubCode}
            />
          )}

          {activePage === 'history' && (
            <HistoryPage
              onLoadScan={handleLoadScan}
            />
          )}
        </main>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default App;
