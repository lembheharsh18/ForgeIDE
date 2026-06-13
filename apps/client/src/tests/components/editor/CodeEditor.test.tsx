import { render } from '@testing-library/react';

import { CodeEditor } from '../../../components/editor/CodeEditor';

// We need to mock CodeMirror components heavily because they rely on DOM features
// that jsdom doesn't fully support or implement perfectly.

jest.mock('@codemirror/autocomplete', () => ({
  closeBrackets: jest.fn(),
  closeBracketsKeymap: [],
  autocompletion: jest.fn(),
  completionKeymap: [],
}));

jest.mock('@codemirror/commands', () => ({
  defaultKeymap: [],
  history: jest.fn(),
  historyKeymap: [],
  indentWithTab: {},
}));

jest.mock('@codemirror/lang-cpp', () => ({ cpp: jest.fn() }));
jest.mock('@codemirror/lang-go', () => ({ go: jest.fn() }));
jest.mock('@codemirror/lang-java', () => ({ java: jest.fn() }));
jest.mock('@codemirror/lang-javascript', () => ({ javascript: jest.fn() }));
jest.mock('@codemirror/lang-python', () => ({ python: jest.fn() }));

jest.mock('@codemirror/language', () => ({
  syntaxHighlighting: jest.fn(),
  indentOnInput: jest.fn(),
  bracketMatching: jest.fn(),
  foldGutter: jest.fn(),
  foldKeymap: [],
  HighlightStyle: { define: jest.fn() },
}));

jest.mock('@codemirror/search', () => ({
  searchKeymap: [],
  highlightSelectionMatches: jest.fn(),
}));

jest.mock('@codemirror/state', () => ({
  EditorState: {
    create: jest.fn().mockReturnValue({}),
    allowMultipleSelections: { of: jest.fn() },
    readOnly: { of: jest.fn() },
  },
  Compartment: jest.fn().mockImplementation(() => ({
    of: jest.fn().mockReturnValue({}),
    reconfigure: jest.fn().mockReturnValue({}),
  })),
}));

jest.mock('@codemirror/view', () => {
  const EditorViewMock: any = jest.fn().mockImplementation(() => ({
    destroy: jest.fn(),
    dispatch: jest.fn(),
    state: { doc: { toString: () => 'mock code', length: 9 } },
  }));
  EditorViewMock.theme = jest.fn().mockReturnValue({});
  EditorViewMock.updateListener = { of: jest.fn() };

  return {
    EditorView: EditorViewMock,
    keymap: { of: jest.fn() },
    lineNumbers: jest.fn(),
    highlightActiveLineGutter: jest.fn(),
    highlightSpecialChars: jest.fn(),
    drawSelection: jest.fn(),
    dropCursor: jest.fn(),
    rectangularSelection: jest.fn(),
    crosshairCursor: jest.fn(),
    highlightActiveLine: jest.fn(),
  };
});

jest.mock('@lezer/highlight', () => ({
  tags: new Proxy(
    {},
    {
      get: () => {
        const fn = () => fn;
        return fn;
      },
    },
  ),
}));

// Since we mocked out CodeMirror, we're mainly testing the React wrapper mounts correctly
describe('CodeEditor', () => {
  const mockOnChange = jest.fn();
  const mockOnRun = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders without crashing', () => {
    const { container } = render(
      <CodeEditor language="cpp" theme="dark" value="" onChange={mockOnChange} onRun={mockOnRun} />,
    );
    // Since it's an empty div that CodeMirror attaches to:
    expect(container.firstChild).toBeInTheDocument();
  });

  it('restores from localStorage on mount', () => {
    localStorage.setItem('forge_code_scratch_cpp', 'int main() {}');

    render(
      <CodeEditor language="cpp" theme="dark" value="" onChange={mockOnChange} onRun={mockOnRun} />,
    );

    // Initial value is restored from local storage, so onChange should be called with it
    expect(mockOnChange).toHaveBeenCalledWith('int main() {}');
  });
});
