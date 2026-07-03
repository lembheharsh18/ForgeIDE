import { create } from 'zustand';

import type { Language } from '../config/languages';
import { LANGUAGES, LANGUAGE_KEYS } from '../config/languages';

// ── Types ────────────────────────────────────────

export type Verdict =
  | 'ACCEPTED'
  | 'WRONG_ANSWER'
  | 'TIME_LIMIT_EXCEEDED'
  | 'RUNTIME_ERROR'
  | 'COMPILATION_ERROR'
  | 'PENDING'
  | null;

export interface TestResult {
  index: number;
  input: string;
  expected: string;
  actual: string;
  verdict: Verdict;
  timeMs?: number;
  memoryKb?: number;
}

export interface Problem {
  id: string;
  title: string;
  platform: string;
  difficulty: string;
  tags: string[];
  link?: string | null;
  statement?: string | null;
  inputSpec?: string | null;
  outputSpec?: string | null;
  noteSection?: string | null;
  timeLimit?: number | null;
  memoryLimit?: number | null;
  cfContestId?: string | null;
  cfIndex?: string | null;
  testCases?: Array<{ input: string; output: string }> | null;
  addedById: string;
}

function isLanguage(value: string | null): value is Language {
  return LANGUAGE_KEYS.includes(value as Language);
}

function codeStorageKey(problemId: string | undefined, language: Language) {
  return `forge_code_${problemId ?? 'scratch'}_${language}`;
}

interface EditorState {
  language: Language;
  theme: 'dark' | 'light';
  code: string;
  stdin: string;
  stdout: string;
  stderr: string;
  verdict: Verdict;
  isRunning: boolean;
  isRunningTests: boolean;
  activeTab: 'custom' | 'testcases';
  testResults: TestResult[] | null;
  currentProblem: Problem | null;
  rcMode: boolean;
  fontSize: number;
  executionTimeMs: number | null;
  executionMemoryKb: number | null;
  _hydrated: boolean;
}

interface EditorActions {
  hydrate: () => void;
  setLanguage: (language: Language) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setCode: (code: string) => void;
  setStdin: (stdin: string) => void;
  setOutput: (stdout: string, stderr: string) => void;
  setVerdict: (verdict: Verdict) => void;
  setRunning: (running: boolean) => void;
  setRunningTests: (running: boolean) => void;
  setActiveTab: (tab: 'custom' | 'testcases') => void;
  setTestResults: (results: TestResult[] | null) => void;
  setCurrentProblem: (problem: Problem | null) => void;
  toggleRCMode: () => void;
  setFontSize: (size: number) => void;
  setExecutionMetrics: (timeMs: number | null, memoryKb: number | null) => void;
}

// ── Editor Store ─────────────────────────────────
// Initialize with SSR-safe defaults (dark theme, cpp).
// Call hydrate() after mount to read localStorage.

export const useEditorStore = create<EditorState & EditorActions>((set, get) => ({
  // SSR-safe defaults — must match server render
  language: 'cpp',
  theme: 'dark',
  code: LANGUAGES['cpp'].boilerplate,
  stdin: '',
  stdout: '',
  stderr: '',
  verdict: null,
  isRunning: false,
  isRunningTests: false,
  activeTab: 'custom',
  testResults: null,
  currentProblem: null,
  rcMode: false,
  fontSize: 13,
  executionTimeMs: null,
  executionMemoryKb: null,
  _hydrated: false,

  hydrate: () => {
    if (typeof window === 'undefined' || get()._hydrated) return;
    const storedTheme = (localStorage.getItem('forge_theme') as 'dark' | 'light') || 'dark';
    const storedLanguage = localStorage.getItem('forge_language');
    const storedLang = isLanguage(storedLanguage) ? storedLanguage : 'cpp';
    const savedCode = localStorage.getItem(codeStorageKey(get().currentProblem?.id, storedLang));
    document.documentElement.setAttribute('data-theme', storedTheme === 'light' ? 'light' : '');
    set({
      theme: storedTheme,
      language: storedLang,
      code: savedCode ?? LANGUAGES[storedLang].boilerplate,
      _hydrated: true,
    });
  },

  setLanguage: (language) => {
    const { code, language: prevLang, currentProblem } = get();
    let nextCode = LANGUAGES[language].boilerplate;

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(codeStorageKey(currentProblem?.id, prevLang), code);
      } catch {
        // localStorage full — ignore
      }
      const savedCode = localStorage.getItem(codeStorageKey(currentProblem?.id, language));
      nextCode = savedCode ?? LANGUAGES[language].boilerplate;
      localStorage.setItem('forge_language', language);
    }
    set({ language, code: nextCode });
  },

  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('forge_theme', theme);
      document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : '');
    }
    set({ theme });
  },

  setCode: (code) => set({ code }),
  setStdin: (stdin) => set({ stdin }),
  setOutput: (stdout, stderr) => set({ stdout, stderr }),
  setVerdict: (verdict) => set({ verdict }),
  setRunning: (isRunning) => set({ isRunning }),
  setRunningTests: (isRunningTests) => set({ isRunningTests }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setTestResults: (testResults) => set({ testResults }),
  setCurrentProblem: (currentProblem) => set({ currentProblem }),
  toggleRCMode: () => set((s) => ({ rcMode: !s.rcMode })),
  setFontSize: (fontSize) => set({ fontSize }),
  setExecutionMetrics: (timeMs, memoryKb) =>
    set({ executionTimeMs: timeMs, executionMemoryKb: memoryKb }),
}));
