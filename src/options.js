"use strict";

const DEFAULT_PROMPT = `請詳細逐句分析以下的內容正確性。

「{post_content}」`;

const DEFAULT_PROVIDER = "chatgpt";

const providerRadios = document.querySelectorAll('input[name="provider"]');
const promptEl = document.getElementById("prompt");
const saveBtn = document.getElementById("save");
const resetBtn = document.getElementById("reset");
const statusEl = document.getElementById("status");

function setProviderRadio(value) {
  for (const radio of providerRadios) {
    radio.checked = radio.value === value;
  }
}

function getProviderRadio() {
  for (const radio of providerRadios) {
    if (radio.checked) return radio.value;
  }
  return DEFAULT_PROVIDER;
}

// Load saved settings on open
chrome.storage.sync.get(["prompt", "provider"], (result) => {
  promptEl.value = result.prompt ?? DEFAULT_PROMPT;
  setProviderRadio(result.provider ?? DEFAULT_PROVIDER);
});

function showStatus(message) {
  statusEl.textContent = message;
  statusEl.hidden = false;
  setTimeout(() => {
    statusEl.hidden = true;
  }, 2000);
}

saveBtn.addEventListener("click", () => {
  chrome.storage.sync.set(
    { prompt: promptEl.value, provider: getProviderRadio() },
    () => {
      showStatus("Saved.");
    },
  );
});

resetBtn.addEventListener("click", () => {
  chrome.storage.sync.remove(["prompt", "provider"], () => {
    promptEl.value = DEFAULT_PROMPT;
    setProviderRadio(DEFAULT_PROVIDER);
    showStatus("Reset to default.");
  });
});
