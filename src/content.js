"use strict";

const BUTTON_MARKER = "data-objectivity-injected";

const DEFAULT_PROMPT = `請搜尋網路上的資訊，詳細逐句分析從 Threads 上看到的以下內容。

「{post_content}」`;

const DEFAULT_PROVIDER = "chatgpt";
const DEFAULT_ICON_ACTION = "menu";

let currentPrompt = DEFAULT_PROMPT;
let currentProvider = DEFAULT_PROVIDER;
let currentIconAction = DEFAULT_ICON_ACTION;

// Load settings from storage
chrome.storage.sync.get(["prompt", "provider", "iconAction"], (result) => {
  if (result.prompt) {
    currentPrompt = result.prompt;
  }
  if (result.provider) {
    currentProvider = result.provider;
  }
  if (result.iconAction) {
    currentIconAction = result.iconAction;
  }
});

// Listen for setting changes in real time
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync") {
    if (changes.prompt) {
      currentPrompt = changes.prompt.newValue ?? DEFAULT_PROMPT;
    }
    if (changes.provider) {
      currentProvider = changes.provider.newValue ?? DEFAULT_PROVIDER;
    }
    if (changes.iconAction) {
      currentIconAction = changes.iconAction.newValue ?? DEFAULT_ICON_ACTION;
    }
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
    // Nav-level More uses <rect> elements — skip those.
    // Post-level More buttons use either:
    //   - three <circle> elements (old style, cx=6,12,18)
    //   - a single <path> element (new style, three dots as path)
    if (svg.querySelectorAll("rect").length > 0) continue;

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
  const allSpans = postEl.querySelectorAll('span[dir="auto"]');
  if (allSpans.length > 0) {
    const texts = Array.from(allSpans)
      // Skip username spans (they have translate="no")
      .filter((n) => !n.hasAttribute("translate"))
      .map((n) => n.textContent.trim())
      .filter((t) => t.length > 0)
      // The "Translate" button is nested inside span[dir="auto"],
      // so its text leaks into textContent — strip it from the end.
      .map((t) => t.replace(/\s*Translate$/, "").trim())
      .filter((t) => t.length > 0);
    // Filter out short items that are likely metadata (timestamps like "1h")
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
  const NS = "http://www.w3.org/2000/svg";

  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("width", "20");
  svg.setAttribute("height", "20");
  svg.style.setProperty("--x-height", "20px");
  svg.style.setProperty("--x-width", "20px");

  const circle = document.createElementNS(NS, "circle");
  circle.setAttribute("cx", "11");
  circle.setAttribute("cy", "11");
  circle.setAttribute("r", "8");
  svg.appendChild(circle);

  const line1 = document.createElementNS(NS, "line");
  line1.setAttribute("x1", "21");
  line1.setAttribute("y1", "21");
  line1.setAttribute("x2", "16.65");
  line1.setAttribute("y2", "16.65");
  svg.appendChild(line1);

  const line2 = document.createElementNS(NS, "line");
  line2.setAttribute("x1", "8");
  line2.setAttribute("y1", "11");
  line2.setAttribute("x2", "14");
  line2.setAttribute("y2", "11");
  svg.appendChild(line2);

  const line3 = document.createElementNS(NS, "line");
  line3.setAttribute("x1", "11");
  line3.setAttribute("y1", "8");
  line3.setAttribute("x2", "11");
  line3.setAttribute("y2", "14");
  svg.appendChild(line3);

  const inner = document.createElement("div");
  inner.appendChild(svg);

  const btn = document.createElement("div");
  btn.className = "objectivity-btn";
  btn.setAttribute("role", "button");
  btn.setAttribute("tabindex", "0");
  btn.setAttribute("aria-label", "分析客觀性");
  btn.title = "分析客觀性";
  btn.appendChild(inner);
  return btn;
}

/**
 * Build the analysis URL for a given provider.
 */
function buildAnalysisUrl(postText, provider) {
  const prompt = currentPrompt.replace("{post_content}", postText);
  const encoded = encodeURIComponent(prompt);

  switch (provider) {
    case "claude":
      return `https://claude.ai/new?q=${encoded}&incognito=true#objectivity-auto`;
    case "chatgpt":
    default:
      return `https://chatgpt.com/?temporary-chat=true&q=${encoded}#objectivity-auto`;
  }
}

/**
 * Open an AI provider with the analysis prompt.
 */
function openAnalysis(postText, provider) {
  const url = buildAnalysisUrl(postText, provider);
  window.open(url, "_blank");
}

/**
 * Close any open objectivity dropdown menu.
 */
function closeDropdown() {
  const existing = document.querySelector(".objectivity-dropdown");
  if (existing) existing.remove();
}

/**
 * Show a dropdown menu to choose the AI provider.
 */
function showDropdown(anchorEl, postText) {
  closeDropdown();

  const menu = document.createElement("div");
  menu.className = "objectivity-dropdown";

  const items = [
    { label: "ChatGPT", provider: "chatgpt" },
    { label: "Claude", provider: "claude" },
  ];

  for (const item of items) {
    const btn = document.createElement("div");
    btn.className = "objectivity-dropdown-item";
    btn.textContent = item.label;
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeDropdown();
      openAnalysis(postText, item.provider);
    });
    menu.appendChild(btn);
  }

  // Position relative to the anchor button
  anchorEl.style.position = "relative";
  menu.style.position = "absolute";
  menu.style.top = "100%";
  menu.style.right = "0";
  menu.style.zIndex = "9999";
  anchorEl.appendChild(menu);

  // Close when clicking outside
  setTimeout(() => {
    document.addEventListener("click", closeDropdown, { once: true });
  }, 0);
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

    const trimmed = text.trim();

    if (currentIconAction === "menu") {
      showDropdown(btn, trimmed);
    } else {
      openAnalysis(trimmed, currentProvider);
    }
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
