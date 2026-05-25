'use client';

import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { cpp } from '@codemirror/lang-cpp';
import { go } from '@codemirror/lang-go';
import { java } from '@codemirror/lang-java';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import {
  syntaxHighlighting,
  indentOnInput,
  bracketMatching,
  foldGutter,
  foldKeymap,
  HighlightStyle,
} from '@codemirror/language';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { EditorState, Compartment } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLineGutter,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  highlightActiveLine,
} from '@codemirror/view';
import { tags as t } from '@lezer/highlight';
import { useEffect, useRef, useState, useCallback } from 'react';

import type { Language } from '../../config/languages';
import { LANGUAGES } from '../../config/languages';

// ── FORGE Dark Theme ─────────────────────────────

const forgeDarkHighlight = HighlightStyle.define([
  { tag: t.keyword, color: '#c084fc' },
  { tag: t.function(t.variableName), color: '#60a5fa' },
  { tag: t.definition(t.function(t.variableName)), color: '#60a5fa' },
  { tag: t.string, color: '#86efac' },
  { tag: t.number, color: '#fbbf24' },
  { tag: t.bool, color: '#fbbf24' },
  { tag: t.comment, color: '#555555', fontStyle: 'italic' },
  { tag: t.lineComment, color: '#555555', fontStyle: 'italic' },
  { tag: t.blockComment, color: '#555555', fontStyle: 'italic' },
  { tag: t.operator, color: '#f472b6' },
  { tag: t.arithmeticOperator, color: '#f472b6' },
  { tag: t.logicOperator, color: '#f472b6' },
  { tag: t.compareOperator, color: '#f472b6' },
  { tag: t.typeName, color: '#fb923c' },
  { tag: t.className, color: '#fb923c' },
  { tag: t.definition(t.typeName), color: '#fb923c' },
  { tag: t.propertyName, color: '#60a5fa' },
  { tag: t.variableName, color: '#f0f0f0' },
  { tag: t.definition(t.variableName), color: '#f0f0f0' },
  { tag: t.bracket, color: '#888888' },
  { tag: t.paren, color: '#888888' },
  { tag: t.squareBracket, color: '#888888' },
  { tag: t.angleBracket, color: '#888888' },
  { tag: t.brace, color: '#888888' },
  { tag: t.meta, color: '#c084fc' },
  { tag: t.processingInstruction, color: '#c084fc' },
  { tag: t.tagName, color: '#f472b6' },
  { tag: t.attributeName, color: '#fbbf24' },
  { tag: t.null, color: '#f472b6' },
  { tag: t.controlKeyword, color: '#c084fc' },
  { tag: t.moduleKeyword, color: '#c084fc' },
]);

const forgeDarkTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#0a0a0a',
      color: '#f0f0f0',
      height: '100%',
    },
    '.cm-content': {
      caretColor: '#e8ff5a',
      fontFamily: "'Space Mono', monospace",
      fontSize: '13px',
      lineHeight: '1.85',
      padding: '8px 0',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: '#e8ff5a',
      borderLeftWidth: '2px',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: 'rgba(232, 255, 90, 0.15) !important',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
    },
    '.cm-gutters': {
      backgroundColor: '#111111',
      color: '#555555',
      borderRight: '1px solid #2a2a2a',
      fontFamily: "'Space Mono', monospace",
      fontSize: '11px',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      color: '#888888',
    },
    '.cm-foldPlaceholder': {
      backgroundColor: '#1a1a1a',
      border: '1px solid #333333',
      color: '#888888',
    },
    '.cm-tooltip': {
      backgroundColor: '#1a1a1a',
      border: '1px solid #333333',
      color: '#f0f0f0',
    },
    '.cm-tooltip-autocomplete': {
      '& > ul > li[aria-selected]': {
        backgroundColor: 'rgba(232, 255, 90, 0.1)',
        color: '#f0f0f0',
      },
    },
    '.cm-searchMatch': {
      backgroundColor: 'rgba(232, 255, 90, 0.2)',
      outline: '1px solid rgba(232, 255, 90, 0.4)',
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
      backgroundColor: 'rgba(232, 255, 90, 0.35)',
    },
    '.cm-matchingBracket': {
      backgroundColor: 'rgba(232, 255, 90, 0.15)',
      outline: '1px solid rgba(232, 255, 90, 0.3)',
    },
    '.cm-panels': {
      backgroundColor: '#111111',
      color: '#f0f0f0',
    },
    '.cm-panel.cm-search': {
      backgroundColor: '#111111',
    },
    '.cm-panel.cm-search input': {
      backgroundColor: '#1a1a1a',
      border: '1px solid #333333',
      color: '#f0f0f0',
    },
    '.cm-panel.cm-search button': {
      backgroundColor: '#1a1a1a',
      border: '1px solid #333333',
      color: '#f0f0f0',
    },
  },
  { dark: true },
);

// ── FORGE Light Theme ────────────────────────────

const forgeLightHighlight = HighlightStyle.define([
  { tag: t.keyword, color: '#7c3aed' },
  { tag: t.function(t.variableName), color: '#2563eb' },
  { tag: t.definition(t.function(t.variableName)), color: '#2563eb' },
  { tag: t.string, color: '#16a34a' },
  { tag: t.number, color: '#d97706' },
  { tag: t.bool, color: '#d97706' },
  { tag: t.comment, color: '#9ca3af', fontStyle: 'italic' },
  { tag: t.lineComment, color: '#9ca3af', fontStyle: 'italic' },
  { tag: t.blockComment, color: '#9ca3af', fontStyle: 'italic' },
  { tag: t.operator, color: '#db2777' },
  { tag: t.arithmeticOperator, color: '#db2777' },
  { tag: t.logicOperator, color: '#db2777' },
  { tag: t.compareOperator, color: '#db2777' },
  { tag: t.typeName, color: '#ea580c' },
  { tag: t.className, color: '#ea580c' },
  { tag: t.definition(t.typeName), color: '#ea580c' },
  { tag: t.propertyName, color: '#2563eb' },
  { tag: t.variableName, color: '#0a0a0a' },
  { tag: t.definition(t.variableName), color: '#0a0a0a' },
  { tag: t.bracket, color: '#555555' },
  { tag: t.paren, color: '#555555' },
  { tag: t.meta, color: '#7c3aed' },
  { tag: t.processingInstruction, color: '#7c3aed' },
  { tag: t.null, color: '#db2777' },
  { tag: t.controlKeyword, color: '#7c3aed' },
  { tag: t.moduleKeyword, color: '#7c3aed' },
]);

const forgeLightTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#f5f5f0',
      color: '#0a0a0a',
      height: '100%',
    },
    '.cm-content': {
      caretColor: '#0a0a0a',
      fontFamily: "'Space Mono', monospace",
      fontSize: '13px',
      lineHeight: '1.85',
      padding: '8px 0',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: '#0a0a0a',
      borderLeftWidth: '2px',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: 'rgba(0, 0, 0, 0.1) !important',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(0, 0, 0, 0.03)',
    },
    '.cm-gutters': {
      backgroundColor: '#ebebe6',
      color: '#999999',
      borderRight: '1px solid #d0d0c8',
      fontFamily: "'Space Mono', monospace",
      fontSize: '11px',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(0, 0, 0, 0.03)',
      color: '#555555',
    },
    '.cm-foldPlaceholder': {
      backgroundColor: '#e0e0da',
      border: '1px solid #c0c0b8',
      color: '#555555',
    },
    '.cm-tooltip': {
      backgroundColor: '#e0e0da',
      border: '1px solid #c0c0b8',
      color: '#0a0a0a',
    },
    '.cm-tooltip-autocomplete': {
      '& > ul > li[aria-selected]': {
        backgroundColor: 'rgba(0, 0, 0, 0.08)',
        color: '#0a0a0a',
      },
    },
    '.cm-searchMatch': {
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      outline: '1px solid rgba(0, 0, 0, 0.2)',
    },
    '.cm-matchingBracket': {
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      outline: '1px solid rgba(0, 0, 0, 0.2)',
    },
    '.cm-panels': {
      backgroundColor: '#ebebe6',
      color: '#0a0a0a',
    },
    '.cm-panel.cm-search': {
      backgroundColor: '#ebebe6',
    },
    '.cm-panel.cm-search input': {
      backgroundColor: '#f5f5f0',
      border: '1px solid #c0c0b8',
      color: '#0a0a0a',
    },
    '.cm-panel.cm-search button': {
      backgroundColor: '#f5f5f0',
      border: '1px solid #c0c0b8',
      color: '#0a0a0a',
    },
  },
  { dark: false },
);

// ── Language Extension Map ───────────────────────

function getLanguageExtension(lang: Language) {
  switch (lang) {
    case 'cpp':
      return cpp();
    case 'python':
      return python();
    case 'java':
      return java();
    case 'javascript':
      return javascript();
    case 'go':
      return go();
    default:
      return cpp();
  }
}

// ── CodeEditor Component ─────────────────────────

interface CodeEditorProps {
  language: Language;
  theme: 'dark' | 'light';
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  readOnly?: boolean;
  problemId?: string;
}

export function CodeEditor({
  language,
  theme,
  value,
  onChange,
  onRun,
  readOnly = false,
  problemId,
}: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const languageCompartment = useRef(new Compartment());
  const themeCompartment = useRef(new Compartment());
  const highlightCompartment = useRef(new Compartment());
  const readOnlyCompartment = useRef(new Compartment());
  const onChangeRef = useRef(onChange);
  const onRunRef = useRef(onRun);
  const [editorOpacity, setEditorOpacity] = useState(1);
  const prevLanguageRef = useRef(language);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs up to date
  onChangeRef.current = onChange;
  onRunRef.current = onRun;

  // ── Auto-save with debounce ────────────────────
  const autoSave = useCallback(
    (code: string) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        const key = `forge_code_${problemId ?? 'scratch'}_${language}`;
        try {
          localStorage.setItem(key, code);
        } catch {
          // localStorage full — ignore
        }
      }, 1000);
    },
    [problemId, language],
  );

  // ── Initialize Editor ──────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    // Try to restore from localStorage
    const storageKey = `forge_code_${problemId ?? 'scratch'}_${language}`;
    const savedCode = localStorage.getItem(storageKey);
    const initialCode = savedCode || value;

    // Notify parent of restored code
    if (savedCode && savedCode !== value) {
      onChangeRef.current(savedCode);
    }

    const startState = EditorState.create({
      doc: initialCode,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        foldGutter(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        languageCompartment.current.of(getLanguageExtension(language)),
        themeCompartment.current.of(theme === 'dark' ? forgeDarkTheme : forgeLightTheme),
        highlightCompartment.current.of(
          syntaxHighlighting(theme === 'dark' ? forgeDarkHighlight : forgeLightHighlight),
        ),
        readOnlyCompartment.current.of(EditorState.readOnly.of(readOnly)),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...completionKeymap,
          ...searchKeymap,
          ...closeBracketsKeymap,
          ...foldKeymap,
          indentWithTab,
          {
            key: 'Mod-Enter',
            run: () => {
              onRunRef.current();
              return true;
            },
          },
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newCode = update.state.doc.toString();
            onChangeRef.current(newCode);
            autoSave(newCode);
          }
        }),
        EditorView.theme({
          '&': { height: '100%' },
          '.cm-scroller': { overflow: 'auto' },
        }),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Only run on mount and when problemId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problemId]);

  // ── Language Switch ────────────────────────────
  useEffect(() => {
    const view = viewRef.current;
    if (!view || language === prevLanguageRef.current) return;

    const prevLang = prevLanguageRef.current;
    prevLanguageRef.current = language;

    // Fade out
    setEditorOpacity(0);

    setTimeout(() => {
      // Check if current code is previous boilerplate or empty
      const currentCode = view.state.doc.toString();
      const prevBoilerplate = LANGUAGES[prevLang].boilerplate;
      const isBoilerplateOrEmpty =
        !currentCode.trim() || currentCode.trim() === prevBoilerplate.trim();

      // Try to restore saved code for this language
      const storageKey = `forge_code_${problemId ?? 'scratch'}_${language}`;
      const savedCode = localStorage.getItem(storageKey);

      let newCode: string;
      if (savedCode) {
        newCode = savedCode;
      } else if (isBoilerplateOrEmpty) {
        newCode = LANGUAGES[language].boilerplate;
      } else {
        newCode = currentCode;
      }

      // Update language extension
      view.dispatch({
        effects: [languageCompartment.current.reconfigure(getLanguageExtension(language))],
      });

      // Update code
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: newCode,
        },
      });

      onChangeRef.current(newCode);

      // Fade in
      setTimeout(() => setEditorOpacity(1), 30);
    }, 150);
  }, [language, problemId]);

  // ── Theme Switch ───────────────────────────────
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    view.dispatch({
      effects: [
        themeCompartment.current.reconfigure(theme === 'dark' ? forgeDarkTheme : forgeLightTheme),
        highlightCompartment.current.reconfigure(
          syntaxHighlighting(theme === 'dark' ? forgeDarkHighlight : forgeLightHighlight),
        ),
      ],
    });
  }, [theme]);

  // ── ReadOnly Switch ────────────────────────────
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    view.dispatch({
      effects: readOnlyCompartment.current.reconfigure(EditorState.readOnly.of(readOnly)),
    });
  }, [readOnly]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden"
      style={{
        opacity: editorOpacity,
        transition: 'opacity 150ms ease',
      }}
    />
  );
}
