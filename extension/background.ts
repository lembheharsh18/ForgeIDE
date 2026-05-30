/* eslint-disable no-console */
// ── Forge IDE — Background Service Worker ────────

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Forge IDE] Extension installed');

  chrome.storage.local.set({
    extensionEnabled: true,
    forgeUrl: 'http://localhost:3000',
  });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'OPEN_IN_FORGE') {
    chrome.storage.local.get(['forgeUrl'], (result) => {
      const baseUrl = result.forgeUrl || 'http://localhost:3000';
      const url = `${baseUrl}/editor?cf=${message.contestId}&problem=${message.problemIndex}`;
      chrome.tabs.create({ url });
      sendResponse({ success: true });
    });
    return true; // async response
  }
});
