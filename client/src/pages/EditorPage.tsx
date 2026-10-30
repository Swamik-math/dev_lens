import React, { useState } from 'react';
import Editor, { DiffEditor } from '@monaco-editor/react';
import { 
  Play, 
  Bookmark, 
  Columns, 
  Sliders, 
  Cpu, 
  Sparkles, 
  Check, 
  AlertCircle,
  Clock,
  Layers,
  ShieldAlert
} from 'lucide-react';
import { AnalysisResult, SupportedLanguage, SavedAnalysis } from '../shared/types';

interface EditorPageProps {
  code: string;
  setCode: (code: string) => void;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  result: AnalysisResult | null;
  setResult: (res: AnalysisResult | null) => void;
  onRunAnalysis: () => Promise<void>;
  loading: boolean;
  onSaveToHistory: (name: string) => Promise<void>;
}

const SAMPLE_CODES: Record<string, { language: SupportedLanguage; code: string; label: string }> = {
  nestedLoop: {
    label: 'Nested Loop (O(n²) C++)',
    language: 'cpp',
    code: `// DevLens Sample: Nested loops in C++
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
}`
  },
  insecureJs: {
    label: 'Insecure JavaScript (Eval & Debug Logs)',
    language: 'javascript',
    code: `// DevLens Sample: Security & Quality Smells
function executeTask(userInput) {
  console.log("Processing payload:", userInput);
  
  // FIXME: Security audit required
  const apiKey = "AIzaSyD9834FakeSecretKeyExample98234";
  
  try {
    eval(userInput);
  } catch (err) {}

  document.getElementById("output").innerHTML = userInput;
}`
  },
  recursion: {
    label: 'Recursive Fibonacci (O(2ⁿ) Exponential)',
    language: 'javascript',
    code: `// DevLens Sample: Exponential Branching Recursion
function fibonacci(n) {
  if (n <= 1) return n;
  // Multiple recursive branch calls
  return fibonacci(n - 1) + fibonacci(n - 2);
}`
  },
  linearOptimized: {
    label: 'Linear Search with Set (O(n) TypeScript)',
    language: 'typescript',
    code: `// DevLens Sample: Linear lookup using HashSet
export function twoSum(nums: number[], target: number): [number, number] | null {
  const map = new Map<number, number>();
  
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement)!, i];
    }
    map.set(nums[i], i);
  }
  return null;
}`
  }
};

export const EditorPage: React.FC<EditorPageProps> = ({
  code,
  setCode,
  language,
  setLanguage,
  result,
  onRunAnalysis,
  loading,
  onSaveToHistory
}) => {
  const [editorMode, setEditorMode] = useState<'standard' | 'diff'>('standard');
  const [saveName, setSaveName] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSampleChange = (key: string) => {
    const sample = SAMPLE_CODES[key];
    if (sample) {
      setLanguage(sample.language);
      setCode(sample.code);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    const name = saveName.trim() || `Scan ${language.toUpperCase()} (${new Date().toLocaleTimeString()})`;
    setSaving(true);
    await onSaveToHistory(name);
    setSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const refactoredMock = result?.aiReview?.optimizations?.[0]?.afterSnippet 
    ? `// === DevLens AI Refactored Code ===\n${result.aiReview.optimizations[0].afterSnippet}\n\n// Original Code Reference:\n${code}`
    : code;

  return (
    <div className="editor-page-container">
      {/* Editor Toolbar (inspired by image 3) */}
      <div className="editor-top-toolbar">
        <div className="toolbar-left">
          {/* Preset Selector */}
          <select 
            className="select-input"
            onChange={(e) => handleSampleChange(e.target.value)}
            defaultValue="nestedLoop"
          >
            <option disabled>Choose Sample Code</option>
            {Object.entries(SAMPLE_CODES).map(([k, item]) => (
              <option key={k} value={k}>{item.label}</option>
            ))}
          </select>

          {/* Language Selector */}
          <select 
            className="select-input"
            value={language}
            onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
          >
            <option value="cpp">C++</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
          </select>

          {/* View Mode: Editor vs Diff Editor */}
          <div className="editor-toggle-group">
            <button 
              className={`toggle-btn ${editorMode === 'standard' ? 'active' : ''}`}
              onClick={() => setEditorMode('standard')}
            >
              Code Editor
            </button>
            <button 
              className={`toggle-btn ${editorMode === 'diff' ? 'active' : ''}`}
              onClick={() => setEditorMode('diff')}
            >
              <Columns size={14} /> Diff vs Refactor
            </button>
          </div>
        </div>

        <div className="toolbar-right">
          {result && (
            <div className="save-form-inline">
              <input 
                type="text" 
                placeholder="Scan name..." 
                className="input-save-name"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
              />
              <button 
                className="btn-secondary" 
                onClick={handleSave}
                disabled={saving}
              >
                {savedSuccess ? <Check size={16} color="#10b981" /> : <Bookmark size={16} />}
                {savedSuccess ? 'Saved!' : 'Save Scan'}
              </button>
            </div>
          )}

          <button 
            className="btn-primary" 
            onClick={onRunAnalysis}
            disabled={loading}
          >
            <Play size={16} fill="currentColor" />
            {loading ? 'Analyzing AST...' : 'Analyze Code'}
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="editor-canvas-wrapper">
        {editorMode === 'standard' ? (
          <Editor
            height="100%"
            theme="vs-dark"
            language={language === 'cpp' ? 'cpp' : language}
            value={code}
            onChange={(val) => setCode(val || '')}
            options={{
              fontFamily: "'Fira Code', monospace",
              fontSize: 14,
              minimap: { enabled: true },
              automaticLayout: true,
              scrollBeyondLastLine: false,
              tabSize: 2
            }}
          />
        ) : (
          <DiffEditor
            height="100%"
            theme="vs-dark"
            language={language === 'cpp' ? 'cpp' : language}
            original={code}
            modified={refactoredMock}
            options={{
              fontFamily: "'Fira Code', monospace",
              fontSize: 13,
              readOnly: true,
              automaticLayout: true
            }}
          />
        )}
      </div>

      {/* Bottom Telemetry Bar */}
      {result && (
        <div className="editor-bottom-bar">
          <div className="telemetry-pill">
            <Clock size={15} color="#60a5fa" />
            <span>Time Complexity: <strong>{result.complexity.timeComplexity}</strong></span>
          </div>
          <div className="telemetry-pill">
            <Layers size={15} color="#34d399" />
            <span>Auxiliary Space: <strong>{result.complexity.spaceComplexity}</strong></span>
          </div>
          <div className="telemetry-pill">
            <ShieldAlert size={15} color={result.findings.length > 0 ? '#f87171' : '#34d399'} />
            <span>Findings: <strong>{result.findings.length}</strong></span>
          </div>
          <div className="telemetry-pill">
            <Sparkles size={15} color="#c084fc" />
            <span>Rating: <strong>{result.aiReview?.overallRating || 'Good'}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};
