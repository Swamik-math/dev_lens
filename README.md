# DevLens — See Beyond the Code

> **AI-Powered Code Analysis & Developer Productivity Platform**
> Built as a rigorous engineering project combining **deterministic static analysis (AST & Rule Engines)** with **contextual AI cognitive explanations**.

---

## 🚀 Key Highlights (Placement & Interview Ready)

1. **Deterministic Static Engine vs. AI Wrapper:**
   - Instead of blindly querying an LLM for Big-O, DevLens computes time and space complexities deterministically using AST and loop/recursion graph analysis.
   - The AI layer is fed deterministic ground-truth context to provide hallucination-free explanations and refactoring diffs.
2. **Object-Oriented Design (OOP):**
   - **Strategy / Rule Engine Pattern:** Modular rules (`RULE_TODO_FIXME`, `RULE_DEBUG_LOGS`, `RULE_SECURITY_UNSAFE`, `RULE_EMPTY_BLOCK`, `RULE_HARDCODED_SECRETS`, `RULE_DEEP_NESTING`) registered through an extensible `RuleRegistry`.
   - **Metrics Engine:** McCabe cyclomatic complexity and SEI Maintainability Index calculations.
3. **Data Structures & Algorithms (DSA):**
   - Loop nesting depth tracking and step analysis ($O(1)$, $O(\log n)$, $O(n)$, $O(n \log n)$, $O(n^2)$, $O(n^3)$).
   - Recursive call graph branching detection (distinguishes linear recursion $O(n)$ from exponential branching $O(2^n)$).
   - Auxiliary space allocation detection.

---

## 🛠️ Project Structure

```
devlens/
├── client/                     # Frontend (React 18, Vite, TypeScript, Monaco Editor)
│   ├── src/
│   │   ├── App.tsx             # Split-pane workspace & interactive dashboard
│   │   ├── index.css           # Modern dark-theme developer UI
│   │   └── shared/types.ts     # Synchronized TypeScript contracts
├── server/                     # Backend API (Node.js, Express, TypeScript)
│   ├── src/
│   │   ├── analyzer/
│   │   │   ├── rules/          # Pluggable static analysis rules (OOP Strategy)
│   │   │   ├── complexity/     # Big-O Time & Auxiliary Space Engine
│   │   │   ├── metrics/        # McCabe Cyclomatic & Maintainability Index
│   │   │   ├── RuleRegistry.ts # Rule lifecycle manager
│   │   │   └── AnalyzerService.ts # Main analysis orchestrator
│   │   ├── services/
│   │   │   └── aiService.ts    # Cognitive AI synthesizer with heuristic fallback
│   │   └── index.ts            # Express REST API (CORS, error handling, /api/analyze)
└── README.md
```

---

## 🏃 Running DevLens Locally

### 1. Start Backend API Server
```bash
cd server
npm run dev
# Server listens on http://localhost:5001
```

### 2. Start Frontend Workspace
```bash
cd client
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 🗺️ Roadmap Progress

- [x] **Phase 1: Frontend Dashboard & Editor** (React, Monaco Editor, multi-language switcher, sample presets)
- [x] **Phase 2: Backend & REST API** (Express, TypeScript, `/api/analyze`, CORS, input validation)
- [x] **Phase 3: Deterministic Static Code Analysis** (Extensible Rule Engine, 6 production rules)
- [x] **Phase 4: Time & Space Complexity Analyzer** (Big-O loop depth, recursion branching, step multiplier, auxiliary space)
- [x] **Phase 5: Gemini AI Code Review & Mathematical Engine** (Big-O asymptotic reasoning and refactor diffs)
- [x] **Phase 6: In-Editor Code Runner** (Subprocess execution with interactive terminal drawer)
- [x] **Phase 7: JWT Authentication & User Accounts** (Bcrypt password hashing & session management)
- [x] **Phase 8: Analysis History & Regression Tracking** (Persistent database and telemetry trends)
- [x] **Phase 9: GitHub Repository Integration** (PAT/username sync, repo browser & 1-click import)
- [x] **Phase 10: Modern SaaS Redesign** (Linear/Vercel dark graphite aesthetic with responsive layout)
