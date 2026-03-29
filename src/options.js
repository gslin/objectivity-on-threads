"use strict";

const DEFAULT_PROVIDER = "chatgpt";
const DEFAULT_ICON_ACTION = "menu";

const providerRadios = document.querySelectorAll('input[name="provider"]');
const iconActionRadios = document.querySelectorAll('input[name="iconAction"]');
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

function showStatus(msg) {
  statusEl.textContent = msg;
  statusEl.hidden = false;
  setTimeout(() => {
    statusEl.hidden = true;
  }, 2000);
}

// Load saved settings on open
chrome.storage.sync.get(["provider", "iconAction"], (result) => {
  setRadio(providerRadios, result.provider ?? DEFAULT_PROVIDER);
  setRadio(iconActionRadios, result.iconAction ?? DEFAULT_ICON_ACTION);
});

saveBtn.addEventListener("click", () => {
  chrome.storage.sync.set(
    {
      provider: getRadio(providerRadios, DEFAULT_PROVIDER),
      iconAction: getRadio(iconActionRadios, DEFAULT_ICON_ACTION),
    },
    () => {
      showStatus("已儲存。");
    },
  );
});

resetBtn.addEventListener("click", () => {
  chrome.storage.sync.remove(["provider", "iconAction"], () => {
    setRadio(providerRadios, DEFAULT_PROVIDER);
    setRadio(iconActionRadios, DEFAULT_ICON_ACTION);
    showStatus("已恢復預設。");
  });
});
