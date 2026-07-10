import { create } from 'zustand';

// ── Types ────────────────────────────────────────

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'MEMBER' | 'ADMIN';
  codeforcesHandle?: string | null;
  codechefHandle?: string | null;
  leetcodeUsername?: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
  leaderboard?: {
    score: number;
    solvedCount: number;
    rank: number;
  } | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setUser: (user: User) => void;
}

// ── Auth Store ───────────────────────────────────
// Access token stored in memory only (not localStorage)
// for security. Refresh token in httpOnly cookie
// handles persistence across page reloads.

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  accessToken: null,
  isLoading: true,
  isAuthenticated: false,

  setAuth: (user, accessToken) =>
    set({
      user,
      accessToken,
      isAuthenticated: true,
      isLoading: false,
    }),

  clearAuth: () =>
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setUser: (user) => set({ user }),
}));
