"use strict";

const BUTTON_MARKER = "data-objectivity-injected";

const DEFAULT_PROMPT = `請詳細逐句分析以下的內容正確性。

「{post_content}」`;

let currentPrompt = DEFAULT_PROMPT;

// Load custom prompt from storage
chrome.storage.sync.get("prompt", (result) => {
  if (result.prompt) {
    currentPrompt = result.prompt;
  }
});

// Listen for prompt changes in real time
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.prompt) {
    currentPrompt = changes.prompt.newValue ?? DEFAULT_PROMPT;
  }
});

/**
 * Find the post-level three-dot "More" button inside a post element.
 * Uses aria-label="More" on the SVG, then filters to post-level buttons
 * (which use <circle> elements, not <rect> like the nav hamburger menu).
 */
function findMoreButton(postEl) {
  const svgs = postEl.querySelectorAll('svg[aria-label="More"]');
  for (const svg of svgs) {
    // Post-level More buttons use three <circle> elements (cx=6,12,18)
    // Nav-level More uses <rect> elements — skip those
    if (svg.querySelectorAll("circle").length !== 3) continue;

    // Walk up to the clickable role="button" with aria-haspopup="menu"
    const btn =
      svg.closest('[role="button"][aria-haspopup="menu"]') ||
      svg.closest('[role="button"]');
    if (btn) return btn;
  }
  return null;
}

/**
 * Extract the text content of a post.
 */
function extractPostText(postEl) {
  // Threads post text lives inside span[dir="auto"] elements.
  // Collect all of them, then filter out short metadata (timestamps, usernames).
  const allSpans = postEl.querySelectorAll('span[dir="auto"]');
  if (allSpans.length > 0) {
    const texts = Array.from(allSpans)
      .map((n) => n.textContent.trim())
      .filter((t) => t.length > 0);
    // Filter out short items that are likely metadata (timestamps like "1h", usernames)
    const bodyTexts = texts.filter((t) => t.length > 3 || texts.length <= 2);
    if (bodyTexts.length > 0) {
      return bodyTexts.join("\n");
    }
  }

  // Fallback to innerText of the post container
  return postEl.innerText.substring(0, 2000);
}

/**
 * Create the analysis button element.
 */
function createAnalysisButton() {
  const btn = document.createElement("div");
  btn.className = "objectivity-btn";
  btn.setAttribute("role", "button");
  btn.setAttribute("tabindex", "0");
  btn.setAttribute("aria-label", "分析客觀性");
  btn.title = "分析客觀性";
  btn.innerHTML = `<div><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="--x-height: 20px; --x-width: 20px;" width="20" height="20">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    <line x1="8" y1="11" x2="14" y2="11"/>
    <line x1="11" y1="8" x2="11" y2="14"/>
  </svg></div>`;
  return btn;
}

/**
 * Open ChatGPT temporary chat with the analysis prompt.
 */
function openChatGPTAnalysis(postText) {
  const prompt = currentPrompt.replace("{post_content}", postText);
  const url = `https://chatgpt.com/?temporary-chat=true&q=${encodeURIComponent(prompt)}`;
  window.open(url, "_blank");
}

/**
 * Process a single post element: inject the analysis button if not already present.
 */
function processPost(postEl) {
  if (postEl.getAttribute(BUTTON_MARKER)) return;

  const moreBtn = findMoreButton(postEl);
  if (!moreBtn) return;

  postEl.setAttribute(BUTTON_MARKER, "true");

  const btn = createAnalysisButton();
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const text = extractPostText(postEl);
    if (!text || text.trim().length === 0) {
      console.warn("[Objectivity on Threads] Could not extract post text.");
      return;
    }

    openChatGPTAnalysis(text.trim());
  });

  // The More button (div[role="button"]) sits inside a wrapper div.
  // Insert our button before that wrapper in the outer flex container,
  // so it appears to the left of the three-dot menu without breaking layout.
  const moreWrapper = moreBtn.parentElement;
  moreWrapper.parentElement.insertBefore(btn, moreWrapper);
}

/**
 * Scan the page for post elements and inject buttons.
 */
function scanAndInject() {
  // Threads uses div[data-pressable-container="true"] as the post container.
  // No <article> tags are used.
  const pressables = document.querySelectorAll(
    'div[data-pressable-container="true"]'
  );
  for (const p of pressables) {
    // The pressable container itself is the post; walk up one level
    // to the wrapping div so we can mark it and find the More button.
    const post = p.parentElement;
    if (post && !post.getAttribute(BUTTON_MARKER)) {
      processPost(post);
    }
  }
}

// Initial scan
scanAndInject();

// Observe DOM changes for SPA navigation and infinite scroll
const observer = new MutationObserver((mutations) => {
  let shouldScan = false;
  for (const mutation of mutations) {
    if (mutation.addedNodes.length > 0) {
      shouldScan = true;
      break;
    }
  }
  if (shouldScan) {
    scanAndInject();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});
