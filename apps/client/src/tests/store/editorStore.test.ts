// ── Editor Store Tests ───────────────────────────

import { LANGUAGES } from '../../config/languages';
import { useEditorStore } from '../../store/editorStore';

// Reset store between tests
beforeEach(() => {
  localStorage.clear();
  useEditorStore.setState({
    language: 'cpp',
    theme: 'dark',
    code: '',
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
  });
});

describe('editorStore', () => {
  it('initial state has correct defaults', () => {
    const state = useEditorStore.getState();
    expect(state.theme).toBe('dark');
    expect(state.isRunning).toBe(false);
    expect(state.rcMode).toBe(false);
    expect(state.verdict).toBeNull();
    expect(state.activeTab).toBe('custom');
    expect(state.fontSize).toBe(13);
  });

  it('setLanguage updates language', () => {
    useEditorStore.getState().setLanguage('python');
    expect(useEditorStore.getState().language).toBe('python');
  });

  it('setLanguage loads the selected language boilerplate when no saved code exists', () => {
    useEditorStore.setState({ language: 'cpp', code: 'int main() { return 0; }' });

    useEditorStore.getState().setLanguage('python');

    expect(useEditorStore.getState().language).toBe('python');
    expect(useEditorStore.getState().code).toBe(LANGUAGES.python.boilerplate);
    expect(localStorage.getItem('forge_code_scratch_cpp')).toBe('int main() { return 0; }');
  });

  it('setLanguage restores saved code for the selected language', () => {
    localStorage.setItem('forge_code_scratch_python', 'print("saved")');

    useEditorStore.getState().setLanguage('python');

    expect(useEditorStore.getState().code).toBe('print("saved")');
  });

  it('setTheme updates theme', () => {
    useEditorStore.getState().setTheme('light');
    expect(useEditorStore.getState().theme).toBe('light');
  });

  it('toggleRCMode flips rcMode', () => {
    expect(useEditorStore.getState().rcMode).toBe(false);
    useEditorStore.getState().toggleRCMode();
    expect(useEditorStore.getState().rcMode).toBe(true);
    useEditorStore.getState().toggleRCMode();
    expect(useEditorStore.getState().rcMode).toBe(false);
  });

  it('setCode updates code', () => {
    useEditorStore.getState().setCode('print("hello")');
    expect(useEditorStore.getState().code).toBe('print("hello")');
  });

  it('setOutput updates stdout and stderr', () => {
    useEditorStore.getState().setOutput('output text', 'error text');
    expect(useEditorStore.getState().stdout).toBe('output text');
    expect(useEditorStore.getState().stderr).toBe('error text');
  });

  it('setVerdict updates verdict', () => {
    useEditorStore.getState().setVerdict('ACCEPTED');
    expect(useEditorStore.getState().verdict).toBe('ACCEPTED');
  });

  it('setRunning updates isRunning', () => {
    useEditorStore.getState().setRunning(true);
    expect(useEditorStore.getState().isRunning).toBe(true);
  });

  it('setFontSize updates fontSize', () => {
    useEditorStore.getState().setFontSize(16);
    expect(useEditorStore.getState().fontSize).toBe(16);
  });

  it('setCurrentProblem updates currentProblem', () => {
    const problem = {
      id: 'test-id',
      title: 'Test Problem',
      platform: 'CUSTOM',
      difficulty: 'easy',
      tags: ['dp'],
      addedById: 'user-1',
    };
    useEditorStore.getState().setCurrentProblem(problem);
    expect(useEditorStore.getState().currentProblem?.title).toBe('Test Problem');
  });
});
