"use strict";

const DEFAULT_PROMPT = `請逐字分析以下 Threads 貼文的客觀性。請指出：
1. 主觀用語與情緒性字詞
2. 可能的偏見或立場傾向
3. 事實陳述 vs 個人觀點
4. 整體客觀性評分（1-10）

貼文內容：
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
