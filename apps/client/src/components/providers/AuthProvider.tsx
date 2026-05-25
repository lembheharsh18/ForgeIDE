'use client';

import { useEffect } from 'react';

import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';

// ── AuthProvider ─────────────────────────────────
// On mount: attempts to restore session via GET /api/auth/me.
// If 401, clears auth state (user not logged in, that's OK).

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, clearAuth, setLoading } = useAuthStore();

  useEffect(() => {
    const restoreSession = async () => {
      setLoading(true);
      try {
        // First try to get a fresh access token via refresh
        const refreshRes = await api.post('/api/auth/refresh');
        const { accessToken } = refreshRes.data;

        // Then fetch user data with the new token
        const meRes = await api.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        setAuth(meRes.data.user, accessToken);
      } catch {
        // Not logged in — that's fine
        clearAuth();
      }
    };

    restoreSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
