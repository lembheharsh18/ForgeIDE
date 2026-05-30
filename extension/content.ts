/* eslint-disable no-console */
// ── Forge IDE — Codeforces Content Script ────────
// Injects "Open in Forge IDE" button on CF problem pages

(function () {
  'use strict';

  // ── Parse URL for contestId + problemIndex ──────
  function parseCFUrl(): { contestId: string; problemIndex: string } | null {
    const path = window.location.pathname;

    // /problemset/problem/{contestId}/{index}
    const problemsetMatch = path.match(/\/problemset\/problem\/(\d+)\/([A-Za-z]\d*)/);
    if (problemsetMatch) {
      return { contestId: problemsetMatch[1], problemIndex: problemsetMatch[2].toUpperCase() };
    }

    // /contest/{contestId}/problem/{index}
    const contestMatch = path.match(/\/contest\/(\d+)\/problem\/([A-Za-z]\d*)/);
    if (contestMatch) {
      return { contestId: contestMatch[1], problemIndex: contestMatch[2].toUpperCase() };
    }

    // /gym/{contestId}/problem/{index}
    const gymMatch = path.match(/\/gym\/(\d+)\/problem\/([A-Za-z]\d*)/);
    if (gymMatch) {
      return { contestId: gymMatch[1], problemIndex: gymMatch[2].toUpperCase() };
    }

    return null;
  }

  // ── Check if extension is enabled ─────────────
  function checkEnabled(): Promise<boolean> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['extensionEnabled'], (result) => {
        resolve(result.extensionEnabled !== false);
      });
    });
  }

  // ── Get Forge URL from storage ─────────────────
  function getForgeUrl(): Promise<string> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['forgeUrl'], (result) => {
        resolve(result.forgeUrl || 'http://localhost:3000');
      });
    });
  }

  // ── Inject "Open in Forge IDE" button ──────────
  async function inject() {
    const enabled = await checkEnabled();
    if (!enabled) {
      console.log('[Forge IDE] Extension disabled, skipping injection');
      return;
    }

    const parsed = parseCFUrl();
    if (!parsed) {
      console.log('[Forge IDE] Could not parse CF URL, skipping');
      return;
    }

    const { contestId, problemIndex } = parsed;
    console.log(`[Forge IDE] Detected problem: ${contestId}/${problemIndex}`);

    // Find problem header to inject button
    const header =
      document.querySelector('.problem-statement .header') ||
      document.querySelector('.problemindexholder .title') ||
      document.querySelector('div.title');

    if (!header) {
      console.log('[Forge IDE] Could not find problem header');
      return;
    }

    // Don't inject twice
    if (document.getElementById('forge-ide-btn')) return;

    const forgeUrl = await getForgeUrl();

    // ── Create Button ─────────────────────────────
    const btn = document.createElement('button');
    btn.id = 'forge-ide-btn';
    btn.textContent = '⚡ Open in Forge IDE';
    btn.style.cssText = [
      'background: #e8ff5a',
      'color: #000000',
      'border: none',
      'border-radius: 4px',
      'padding: 6px 14px',
      'font-family: "Space Mono", monospace',
      'font-size: 12px',
      'font-weight: 700',
      'cursor: pointer',
      'letter-spacing: 0.5px',
      'transition: all 0.2s',
      'margin-left: 12px',
      'vertical-align: middle',
      'display: inline-block',
    ].join(';');

    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translateY(-1px)';
      btn.style.boxShadow = '0 4px 12px rgba(232, 255, 90, 0.4)';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translateY(0)';
      btn.style.boxShadow = 'none';
    });

    btn.addEventListener('click', () => {
      const url = `${forgeUrl}/editor?cf=${contestId}&problem=${problemIndex}`;
      window.open(url, '_blank');
    });

    // Inject after the title element
    header.appendChild(btn);

    // ── Inject corner badge ─────────────────────
    const badge = document.createElement('div');
    badge.id = 'forge-ide-badge';
    badge.textContent = '⚡ FORGE';
    badge.style.cssText = [
      'position: fixed',
      'bottom: 16px',
      'right: 16px',
      'background: #0a0a0a',
      'color: #e8ff5a',
      'border: 1px solid #333',
      'border-radius: 6px',
      'padding: 6px 12px',
      'font-family: "Space Mono", monospace',
      'font-size: 10px',
      'font-weight: 700',
      'letter-spacing: 1px',
      'cursor: pointer',
      'z-index: 10000',
      'transition: all 0.2s',
      'opacity: 0.7',
    ].join(';');

    badge.addEventListener('mouseenter', () => {
      badge.style.opacity = '1';
      badge.style.borderColor = '#e8ff5a';
    });

    badge.addEventListener('mouseleave', () => {
      badge.style.opacity = '0.7';
      badge.style.borderColor = '#333';
    });

    badge.addEventListener('click', () => {
      const url = `${forgeUrl}/editor?cf=${contestId}&problem=${problemIndex}`;
      window.open(url, '_blank');
    });

    document.body.appendChild(badge);

    console.log('[Forge IDE] Button injected successfully');
  }

  // ── Run ─────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
