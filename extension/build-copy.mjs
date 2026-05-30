// ── Build Copy Script ────────────────────────────
// Copies static assets to dist/ after esbuild

import { cpSync, mkdirSync } from 'fs';

// Ensure dist exists
mkdirSync('dist/icons', { recursive: true });

// Copy manifest
cpSync('manifest.json', 'dist/manifest.json');

// Copy popup HTML
cpSync('popup.html', 'dist/popup.html');

// Copy icons
cpSync('icons', 'dist/icons', { recursive: true });

console.log('✓ Static assets copied to dist/');
