"use strict";

const DEFAULT_PROMPT = `請搜尋網路上的資訊，詳細逐句分析從 Threads 上看到的以下內容。

「{post_content}」`;

const DEFAULT_PROVIDER = "chatgpt";
const DEFAULT_ICON_ACTION = "menu";

const providerRadios = document.querySelectorAll('input[name="provider"]');
const iconActionRadios = document.querySelectorAll('input[name="iconAction"]');
const promptEl = document.getElementById("prompt");
const saveBtn = document.getElementById("save");
const resetBtn = document.getElementById("reset");
const statusEl = document.getElementById("status");

function setRadio(radios, value) {
  for (const radio of radios) {
    radio.checked = radio.value === value;
  }
}

function getRadio(radios, defaultValue) {
  for (const radio of radios) {
    if (radio.checked) return radio.value;
  }
  return defaultValue;
}

// Load saved settings on open
chrome.storage.sync.get(["prompt", "provider", "iconAction"], (result) => {
  promptEl.value = result.prompt ?? DEFAULT_PROMPT;
  setRadio(providerRadios, result.provider ?? DEFAULT_PROVIDER);
  setRadio(iconActionRadios, result.iconAction ?? DEFAULT_ICON_ACTION);
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
    {
      prompt: promptEl.value,
      provider: getRadio(providerRadios, DEFAULT_PROVIDER),
      iconAction: getRadio(iconActionRadios, DEFAULT_ICON_ACTION),
    },
    () => {
      showStatus("Saved.");
    },
  );
});

resetBtn.addEventListener("click", () => {
  chrome.storage.sync.remove(["prompt", "provider", "iconAction"], () => {
    promptEl.value = DEFAULT_PROMPT;
    setRadio(providerRadios, DEFAULT_PROVIDER);
    setRadio(iconActionRadios, DEFAULT_ICON_ACTION);
    showStatus("Reset to default.");
  });
});
