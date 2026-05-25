'use client';

import { useEffect, useState } from 'react';

import { LANGUAGES } from '../../config/languages';
import { useEditorStore } from '../../store/editorStore';

// ── Status Bar ───────────────────────────────────

export function StatusBar() {
  const { language } = useEditorStore();
  const [clock, setClock] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setClock(
        now.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }),
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const langConfig = LANGUAGES[language];
  const engineLabel =
    language === 'cpp'
      ? 'GCC / Piston'
      : language === 'java'
        ? 'JDK / Piston'
        : language === 'python'
          ? 'CPython / Piston'
          : language === 'go'
            ? 'Go / Piston'
            : 'Node / Piston';

  return (
    <div
      className="flex items-center justify-between px-3 select-none shrink-0"
      style={{
        height: '22px',
        backgroundColor: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
        fontFamily: "'Space Mono', monospace",
        fontSize: '9px',
        letterSpacing: '0.5px',
        color: 'var(--text-muted)',
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: 'var(--green)' }}
          />
          <span style={{ color: 'var(--green)' }}>CONNECTED</span>
        </span>
        <span>
          {langConfig.display} · {engineLabel}
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <span>FORGE IDE v1.0</span>
        <span style={{ color: 'var(--text-secondary)' }}>{clock}</span>
      </div>
    </div>
  );
}
