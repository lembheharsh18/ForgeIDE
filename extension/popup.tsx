/* eslint-disable no-console */
// ── Forge IDE — Popup Script ─────────────────────

(function () {
  'use strict';

  // DOM elements
  const loadingEl = document.getElementById('loading');
  const loginView = document.getElementById('login-view');
  const loggedInView = document.getElementById('logged-in-view');
  const emailInput = document.getElementById('email') as HTMLInputElement;
  const passwordInput = document.getElementById('password') as HTMLInputElement;
  const loginBtn = document.getElementById('login-btn');
  const loginError = document.getElementById('login-error');
  const forgeUrlLogin = document.getElementById('forge-url-login') as HTMLInputElement;
  const forgeUrlSettings = document.getElementById('forge-url-settings') as HTMLInputElement;
  const saveUrlBtn = document.getElementById('save-url-btn');
  const saveUrlSettingsBtn = document.getElementById('save-url-settings-btn');
  const userAvatar = document.getElementById('user-avatar');
  const userName = document.getElementById('user-name');
  const toggleEnabled = document.getElementById('toggle-enabled') as HTMLInputElement;
  const openForgeBtn = document.getElementById('open-forge-btn');
  const logoutBtn = document.getElementById('logout-btn');

  // ── Initialize ──────────────────────────────────

  function init() {
    chrome.storage.local.get(['authToken', 'user', 'forgeUrl', 'extensionEnabled'], (result) => {
      const forgeUrl = result.forgeUrl || 'http://localhost:3000';

      if (result.authToken && result.user) {
        showLoggedIn(result.user, forgeUrl, result.extensionEnabled !== false);
      } else {
        showLogin(forgeUrl);
      }
    });
  }

  // ── Show Login View ─────────────────────────────

  function showLogin(forgeUrl: string) {
    if (loadingEl) loadingEl.classList.add('hidden');
    if (loginView) loginView.classList.remove('hidden');
    if (loggedInView) loggedInView.classList.add('hidden');
    if (forgeUrlLogin) forgeUrlLogin.value = forgeUrl;
  }

  // ── Show Logged In View ─────────────────────────

  function showLoggedIn(
    user: { username: string; avatarUrl?: string },
    forgeUrl: string,
    enabled: boolean,
  ) {
    if (loadingEl) loadingEl.classList.add('hidden');
    if (loginView) loginView.classList.add('hidden');
    if (loggedInView) loggedInView.classList.remove('hidden');

    if (userAvatar) {
      userAvatar.textContent = user.username.slice(0, 2).toUpperCase();
    }
    if (userName) {
      userName.textContent = user.username;
    }
    if (forgeUrlSettings) {
      forgeUrlSettings.value = forgeUrl;
    }
    if (toggleEnabled) {
      toggleEnabled.checked = enabled;
    }
  }

  // ── Login Handler ───────────────────────────────

  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      const email = emailInput?.value?.trim();
      const password = passwordInput?.value?.trim();
      const forgeUrl = forgeUrlLogin?.value?.trim() || 'http://localhost:3000';

      if (!email || !password) {
        if (loginError) {
          loginError.textContent = 'Please enter email and password';
          loginError.classList.remove('hidden');
        }
        return;
      }

      if (loginBtn) loginBtn.textContent = 'LOGGING IN...';
      if (loginError) loginError.classList.add('hidden');

      try {
        const response = await fetch(`${forgeUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Login failed');
        }

        // Store auth data
        chrome.storage.local.set(
          {
            authToken: data.accessToken,
            user: data.user,
            forgeUrl,
          },
          () => {
            showLoggedIn(data.user, forgeUrl, true);
          },
        );
      } catch (err) {
        if (loginError) {
          loginError.textContent = (err as Error).message;
          loginError.classList.remove('hidden');
        }
      } finally {
        if (loginBtn) loginBtn.textContent = 'LOGIN';
      }
    });
  }

  // ── Save URL (Login View) ───────────────────────

  if (saveUrlBtn) {
    saveUrlBtn.addEventListener('click', () => {
      const url = forgeUrlLogin?.value?.trim();
      if (url) {
        chrome.storage.local.set({ forgeUrl: url });
        saveUrlBtn.textContent = '✓ SAVED';
        setTimeout(() => {
          saveUrlBtn.textContent = 'SAVE URL';
        }, 1500);
      }
    });
  }

  // ── Save URL (Settings View) ────────────────────

  if (saveUrlSettingsBtn) {
    saveUrlSettingsBtn.addEventListener('click', () => {
      const url = forgeUrlSettings?.value?.trim();
      if (url) {
        chrome.storage.local.set({ forgeUrl: url });
        saveUrlSettingsBtn.textContent = '✓ SAVED';
        setTimeout(() => {
          saveUrlSettingsBtn.textContent = 'SAVE URL';
        }, 1500);
      }
    });
  }

  // ── Toggle Extension ────────────────────────────

  if (toggleEnabled) {
    toggleEnabled.addEventListener('change', () => {
      chrome.storage.local.set({ extensionEnabled: toggleEnabled.checked });
    });
  }

  // ── Open Forge IDE ──────────────────────────────

  if (openForgeBtn) {
    openForgeBtn.addEventListener('click', () => {
      chrome.storage.local.get(['forgeUrl'], (result) => {
        const url = result.forgeUrl || 'http://localhost:3000';
        chrome.tabs.create({ url });
      });
    });
  }

  // ── Logout ──────────────────────────────────────

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      chrome.storage.local.remove(['authToken', 'user'], () => {
        chrome.storage.local.get(['forgeUrl'], (result) => {
          showLogin(result.forgeUrl || 'http://localhost:3000');
        });
      });
    });
  }

  // ── Initialize ──────────────────────────────────
  init();
})();
