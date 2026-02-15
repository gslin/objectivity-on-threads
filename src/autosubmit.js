"use strict";

// Auto-click the send button once the prompt is loaded from URL parameters.
// Runs on chatgpt.com and claude.ai.

(function () {
  const SELECTORS = [
    'button[data-testid="send-button"]', // ChatGPT
    'button[aria-label="Send message"]', // Claude
  ];

  function findSendButton() {
    for (const sel of SELECTORS) {
      const btn = document.querySelector(sel);
      if (btn && !btn.disabled) return btn;
    }
    return null;
  }

  let clicked = false;

  const observer = new MutationObserver(() => {
    if (clicked) return;

    const btn = findSendButton();
    if (btn) {
      clicked = true;
      observer.disconnect();
      btn.click();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Stop observing after 15 seconds to avoid running forever.
  setTimeout(() => observer.disconnect(), 15000);
})();
