"use strict";

// Inject the analysis prompt into the AI chat editor and send it.
// The prompt is stored in chrome.storage.local by content.js to avoid
// URL length limits.  Only runs when the page has the hash marker.

(function () {
  if (window.location.hash !== "#objectivity-auto") return;

  const INPUT_SELECTORS = [
    "#prompt-textarea", // ChatGPT (ProseMirror contenteditable)
    '[data-testid="chat-input"]', // Claude (Tiptap contenteditable)
    "#ask-input", // Perplexity (Lexical contenteditable)
  ];

  const SEND_SELECTORS = [
    'button[data-testid="send-button"]', // ChatGPT
    'button[aria-label="Send message"]', // Claude
    'button[aria-label="Submit"]', // Perplexity
  ];

  function findInput() {
    for (const sel of INPUT_SELECTORS) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function findSendButton() {
    for (const sel of SEND_SELECTORS) {
      const btn = document.querySelector(sel);
      if (btn && !btn.disabled) return btn;
    }
    return null;
  }

  /**
   * Insert text into a ProseMirror / Tiptap / Lexical contenteditable element.
   * execCommand triggers a trusted beforeinput event that all three editors
   * accept. insertText + insertParagraph keeps content as plain text and
   * avoids HTML/markdown interpretation.
   */
  function insertText(element, text) {
    element.focus();
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (i > 0) {
        document.execCommand("insertParagraph", false, null);
      }
      if (lines[i]) {
        document.execCommand("insertText", false, lines[i]);
      }
    }
  }

  chrome.storage.local.get("objectivityPrompt", (result) => {
    const prompt = result.objectivityPrompt;
    if (!prompt) return;

    // Clear storage immediately — the prompt is held in the local variable.
    chrome.storage.local.remove("objectivityPrompt");

    let incognitoToggled = false;
    let textInserted = false;
    let done = false;

    function tryProcess() {
      if (done) return;

      if (!textInserted) {
        const input = findInput();
        if (!input) return;

        // Perplexity-specific: once the editor is rendered, check whether
        // the page is in incognito mode. If not, click the toggle and
        // wait for re-render before inserting text. The selector is
        // Perplexity-only — no-op for ChatGPT/Claude.
        if (!incognitoToggled) {
          const incognitoBtn = document.querySelector(
            'button[aria-label^="Use incognito"]',
          );
          if (incognitoBtn) {
            incognitoBtn.click();
            incognitoToggled = true;
            return;
          }
          incognitoToggled = true;
        }

        insertText(input, prompt);
        textInserted = true;
      }

      if (textInserted) {
        const btn = findSendButton();
        if (btn) {
          done = true;
          observer.disconnect();
          clearInterval(poll);
          btn.click();
        }
      }
    }

    // Watch for DOM changes (editor / button appearing).
    const observer = new MutationObserver(tryProcess);
    observer.observe(document.body, { childList: true, subtree: true });

    // Also poll every 500 ms as a safety net — MutationObserver can miss
    // the case where the element already exists before observing starts.
    const poll = setInterval(tryProcess, 500);

    // Try immediately in case everything is already rendered.
    tryProcess();

    // Stop after 15 seconds to avoid running forever.
    setTimeout(() => {
      observer.disconnect();
      clearInterval(poll);
    }, 15000);
  });
})();
