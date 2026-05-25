'use client';

import { useCallback } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

import { ClubPanel } from '../../components/editor/ClubPanel';
import { CodeEditor } from '../../components/editor/CodeEditor';
import { IOPanel } from '../../components/editor/IOPanel';
import { ProblemPanel } from '../../components/editor/ProblemPanel';
import { ProblemSidebar } from '../../components/editor/ProblemSidebar';
import { StatusBar } from '../../components/layout/StatusBar';
import { Topbar } from '../../components/layout/Topbar';
import { LANGUAGES } from '../../config/languages';
import { useEditorStore } from '../../store/editorStore';

// ── Resize Handle ────────────────────────────────

function ResizeHandle({ direction = 'horizontal' }: { direction?: 'horizontal' | 'vertical' }) {
  const isHorizontal = direction === 'horizontal';

  return (
    <PanelResizeHandle
      className="group relative flex items-center justify-center"
      style={{
        width: isHorizontal ? '4px' : '100%',
        height: isHorizontal ? '100%' : '4px',
        backgroundColor: 'transparent',
        cursor: isHorizontal ? 'col-resize' : 'row-resize',
      }}
    >
      <div
        className="transition-all duration-150 group-hover:opacity-100 group-active:opacity-100 opacity-0"
        style={{
          position: 'absolute',
          [isHorizontal ? 'width' : 'height']: '2px',
          [isHorizontal ? 'height' : 'width']: '100%',
          backgroundColor: 'var(--accent)',
          opacity: 0,
        }}
      />
      <div
        className="transition-colors duration-150"
        style={{
          position: 'absolute',
          [isHorizontal ? 'width' : 'height']: '1px',
          [isHorizontal ? 'height' : 'width']: '100%',
          backgroundColor: 'var(--border-subtle)',
        }}
      />
    </PanelResizeHandle>
  );
}

// ── Editor Page ──────────────────────────────────

export default function EditorPage() {
  const { language, theme, code, setCode, setRunning } = useEditorStore();

  const handleRun = useCallback(() => {
    setRunning(true);
    // Actual Piston execution will be implemented in Prompt 4
    // For now, simulate a short delay
    setTimeout(() => {
      const { setOutput, setVerdict, setRunning: sr } = useEditorStore.getState();
      sr(false);
      setOutput('// Run connected in Prompt 4', '');
      setVerdict('PENDING');
    }, 500);
  }, [setRunning]);

  const handleLayoutChange = useCallback((sizes: number[]) => {
    try {
      localStorage.setItem('forge_panel_main', JSON.stringify(sizes));
    } catch {
      // ignore
    }
  }, []);

  const handleCenterLayoutChange = useCallback((sizes: number[]) => {
    try {
      localStorage.setItem('forge_panel_center', JSON.stringify(sizes));
    } catch {
      // ignore
    }
  }, []);

  // Restore panel sizes
  let mainSizes: number[] | undefined;
  let centerSizes: number[] | undefined;
  if (typeof window !== 'undefined') {
    try {
      const ms = localStorage.getItem('forge_panel_main');
      if (ms) mainSizes = JSON.parse(ms);
      const cs = localStorage.getItem('forge_panel_center');
      if (cs) centerSizes = JSON.parse(cs);
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Topbar */}
      <Topbar />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup
          direction="horizontal"
          onLayout={handleLayoutChange}
          autoSaveId="forge-main-layout"
        >
          {/* Sidebar */}
          <Panel defaultSize={mainSizes?.[0] ?? 15} minSize={10} maxSize={25} collapsible>
            <ProblemSidebar />
          </Panel>

          <ResizeHandle direction="horizontal" />

          {/* Center: Editor + IO */}
          <Panel defaultSize={mainSizes?.[1] ?? 65} minSize={40}>
            <PanelGroup
              direction="vertical"
              onLayout={handleCenterLayoutChange}
              autoSaveId="forge-center-layout"
            >
              {/* Problem Panel + Editor */}
              <Panel defaultSize={centerSizes?.[0] ?? 70} minSize={30}>
                <div className="flex flex-col h-full overflow-hidden">
                  <ProblemPanel />
                  <div className="flex-1 overflow-hidden">
                    <CodeEditor
                      language={language}
                      theme={theme}
                      value={code || LANGUAGES[language].boilerplate}
                      onChange={setCode}
                      onRun={handleRun}
                    />
                  </div>
                </div>
              </Panel>

              <ResizeHandle direction="vertical" />

              {/* IO Panel */}
              <Panel defaultSize={centerSizes?.[1] ?? 30} minSize={15} maxSize={50}>
                <IOPanel />
              </Panel>
            </PanelGroup>
          </Panel>

          <ResizeHandle direction="horizontal" />

          {/* Club Panel */}
          <Panel defaultSize={mainSizes?.[2] ?? 20} minSize={12} maxSize={25} collapsible>
            <ClubPanel />
          </Panel>
        </PanelGroup>
      </div>

      {/* Status Bar */}
      <StatusBar />
    </div>
  );
}
