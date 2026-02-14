"use strict";

const DEFAULT_PROMPT = `請詳細逐句分析以下的內容正確性。

「{post_content}」`;

const promptEl = document.getElementById("prompt");
const saveBtn = document.getElementById("save");
const resetBtn = document.getElementById("reset");
const statusEl = document.getElementById("status");

// Load saved prompt on open
chrome.storage.sync.get("prompt", (result) => {
  promptEl.value = result.prompt ?? DEFAULT_PROMPT;
});

function showStatus(message) {
  statusEl.textContent = message;
  statusEl.hidden = false;
  setTimeout(() => {
    statusEl.hidden = true;
  }, 2000);
}

saveBtn.addEventListener("click", () => {
  chrome.storage.sync.set({ prompt: promptEl.value }, () => {
    showStatus("Saved.");
  });
});

resetBtn.addEventListener("click", () => {
  chrome.storage.sync.remove("prompt", () => {
    promptEl.value = DEFAULT_PROMPT;
    showStatus("Reset to default.");
  });
});
