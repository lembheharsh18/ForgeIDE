import { create } from 'zustand';

import type { Language } from '../config/languages';
import { LANGUAGES } from '../config/languages';

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
}

interface EditorActions {
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
}

// ── Helpers ──────────────────────────────────────

function getStoredTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  return (localStorage.getItem('forge_theme') as 'dark' | 'light') || 'dark';
}

function getStoredLanguage(): Language {
  if (typeof window === 'undefined') return 'cpp';
  return (localStorage.getItem('forge_language') as Language) || 'cpp';
}

// ── Editor Store ─────────────────────────────────

export const useEditorStore = create<EditorState & EditorActions>((set) => {
  const storedLang = getStoredLanguage();

  return {
    language: storedLang,
    theme: getStoredTheme(),
    code: LANGUAGES[storedLang].boilerplate,
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

    setLanguage: (language) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('forge_language', language);
      }
      set({ language });
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
  };
});
