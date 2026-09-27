"use strict";

// Inject the analysis prompt into the AI chat editor and send it.
// The prompt is stored in chrome.storage.local by content.js to avoid
// URL length limits.  Only runs when the page has the hash marker.

(function () {
  if (window.location.hash !== "#objectivity-auto") return;

  const isPerplexity = window.location.hostname === "www.perplexity.ai";

  const INPUT_SELECTORS = [
    "#prompt-textarea", // ChatGPT (ProseMirror contenteditable)
    'form[data-chatgpt-composer] [data-composer-markdown][contenteditable="true"]',
    '[data-testid="chat-input"]', // Claude (Tiptap contenteditable)
    "#ask-input", // Perplexity (Lexical contenteditable)
  ];

  const SEND_SELECTORS = [
    'button[data-testid="send-button"]', // ChatGPT
    'form[data-chatgpt-composer] button[type="submit"]',
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
      if (btn && !btn.disabled && btn.getAttribute("aria-disabled") !== "true") {
        return btn;
      }
    }
    return null;
  }

  /**
   * Insert text into a ProseMirror / Tiptap / Lexical contenteditable element.
   * Lexical handles replacement input through its editor state. The other
   * editors use insertText + insertParagraph to preserve plain text.
   */
  function insertText(element, text) {
    element.focus();
    if (isPerplexity) {
      // Firefox hides content-script clipboard data from page listeners.
      const event = new InputEvent("beforeinput", {
        bubbles: true,
        cancelable: true,
        inputType: "insertReplacementText",
        data: text,
      });
      element.dispatchEvent(event);
      return;
    }

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

    let incognitoRequested = false;
    let textInserted = false;
    let done = false;

    function tryProcess() {
      if (done) return;

      // Wait for an explicit incognito state before inserting or sending.
      if (
        isPerplexity &&
        !document.querySelector('button[aria-label="Exit incognito"]')
      ) {
        if (!incognitoRequested) {
          const incognitoBtn = document.querySelector(
            'button[aria-label^="Use incognito"]',
          );
          if (incognitoBtn && !incognitoBtn.disabled) {
            incognitoRequested = true;
            incognitoBtn.click();
          }
        }
        return;
      }

      const input = findInput();
      if (!input || !input.isContentEditable) return;

      // Input can be ignored before Lexical is ready, or a re-render can
      // replace the editor. Retry if the current editor is still empty.
      if (!textInserted || (isPerplexity && !input.textContent.trim())) {
        insertText(input, prompt);
        textInserted = true;
        // Let Lexical and the submit button update before checking again.
        if (isPerplexity) return;
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
