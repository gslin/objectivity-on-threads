"use strict";

const DEFAULT_PROVIDER = "chatgpt";
const DEFAULT_ICON_ACTION = "menu";
const THREADS_PERMISSIONS = { origins: ["*://www.threads.com/*"] };

const providerRadios = document.querySelectorAll('input[name="provider"]');
const iconActionRadios = document.querySelectorAll('input[name="iconAction"]');
const saveBtn = document.getElementById("save");
const resetBtn = document.getElementById("reset");
const statusEl = document.getElementById("status");
const grantThreadsBtn = document.getElementById("grant-threads");
const threadsPermissionStatus = document.getElementById("threads-permission-status");

function showThreadsPermission(granted, error) {
  grantThreadsBtn.hidden = granted;
  grantThreadsBtn.disabled = granted;
  threadsPermissionStatus.textContent = error
    ? `無法完成授權：${error.message}`
    : granted
      ? "已授權。請重新整理 Threads 頁面以顯示分析按鈕。"
      : "尚未授權，分析按鈕無法顯示。請按下「授權 Threads」。";
}

function checkThreadsPermission() {
  chrome.permissions.contains(THREADS_PERMISSIONS, (granted) => {
    showThreadsPermission(Boolean(granted), chrome.runtime.lastError);
  });
}

grantThreadsBtn.addEventListener("click", () => {
  grantThreadsBtn.disabled = true;
  // Request directly from the click handler to preserve user activation.
  chrome.permissions.request(THREADS_PERMISSIONS, (granted) => {
    showThreadsPermission(Boolean(granted), chrome.runtime.lastError);
  });
});

checkThreadsPermission();
chrome.permissions.onAdded.addListener(checkThreadsPermission);
chrome.permissions.onRemoved.addListener(checkThreadsPermission);

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
