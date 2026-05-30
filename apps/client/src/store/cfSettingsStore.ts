import { create } from 'zustand';

// ── Types ────────────────────────────────────────

interface CFSettings {
  cfHandle: string;
  cfApiKey: string;
  cfApiSecret: string;
}

interface CFSettingsState extends CFSettings {
  isConfigured: boolean;
}

interface CFSettingsActions {
  setCFSettings: (settings: CFSettings) => void;
  clearCFSettings: () => void;
  loadFromStorage: () => void;
}

// ── Simple obfuscation (NOT encryption) ──────────
// Base64 encode to prevent casual reading of localStorage

function encode(value: string): string {
  if (typeof window === 'undefined') return value;
  try {
    return btoa(value);
  } catch {
    return value;
  }
}

function decode(value: string): string {
  if (typeof window === 'undefined') return value;
  try {
    return atob(value);
  } catch {
    return value;
  }
}

// ── CF Settings Store ────────────────────────────

export const useCFSettingsStore = create<CFSettingsState & CFSettingsActions>((set) => ({
  cfHandle: '',
  cfApiKey: '',
  cfApiSecret: '',
  isConfigured: false,

  setCFSettings: ({ cfHandle, cfApiKey, cfApiSecret }) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('forge_cf_handle', encode(cfHandle));
      localStorage.setItem('forge_cf_apikey', encode(cfApiKey));
      localStorage.setItem('forge_cf_apisecret', encode(cfApiSecret));
    }
    set({
      cfHandle,
      cfApiKey,
      cfApiSecret,
      isConfigured: !!(cfHandle && cfApiKey && cfApiSecret),
    });
  },

  clearCFSettings: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('forge_cf_handle');
      localStorage.removeItem('forge_cf_apikey');
      localStorage.removeItem('forge_cf_apisecret');
    }
    set({
      cfHandle: '',
      cfApiKey: '',
      cfApiSecret: '',
      isConfigured: false,
    });
  },

  loadFromStorage: () => {
    if (typeof window === 'undefined') return;
    const cfHandle = decode(localStorage.getItem('forge_cf_handle') || '');
    const cfApiKey = decode(localStorage.getItem('forge_cf_apikey') || '');
    const cfApiSecret = decode(localStorage.getItem('forge_cf_apisecret') || '');
    set({
      cfHandle,
      cfApiKey,
      cfApiSecret,
      isConfigured: !!(cfHandle && cfApiKey && cfApiSecret),
    });
  },
}));
