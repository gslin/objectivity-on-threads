"use strict";

const DEFAULT_PROVIDER = "chatgpt";
const DEFAULT_ICON_ACTION = "menu";
const SITE_PERMISSIONS = {
  origins: chrome.runtime.getManifest().content_scripts.flatMap((script) => script.matches),
};

const providerRadios = document.querySelectorAll('input[name="provider"]');
const iconActionRadios = document.querySelectorAll('input[name="iconAction"]');
const saveBtn = document.getElementById("save");
const resetBtn = document.getElementById("reset");
const statusEl = document.getElementById("status");
const grantSitesBtn = document.getElementById("grant-sites");
const sitePermissionStatus = document.getElementById("site-permission-status");

function showSitePermissions(granted, error) {
  grantSitesBtn.hidden = granted;
  grantSitesBtn.disabled = granted;
  sitePermissionStatus.textContent = error
    ? `無法完成授權：${error.message}`
    : granted
      ? "已授權所有網站。請重新整理 Threads 與已開啟的 AI 網站頁面。"
      : "尚未取得完整網站權限。請按下「授權網站存取」。";
}

function checkSitePermissions() {
  chrome.permissions.contains(SITE_PERMISSIONS, (granted) => {
    showSitePermissions(Boolean(granted), chrome.runtime.lastError);
  });
}

grantSitesBtn.addEventListener("click", () => {
  grantSitesBtn.disabled = true;
  // Request directly from the click handler to preserve user activation.
  chrome.permissions.request(SITE_PERMISSIONS, (granted) => {
    showSitePermissions(Boolean(granted), chrome.runtime.lastError);
  });
});

checkSitePermissions();
chrome.permissions.onAdded.addListener(checkSitePermissions);
chrome.permissions.onRemoved.addListener(checkSitePermissions);

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
