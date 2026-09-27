"use strict";

const THREADS_PERMISSIONS = { origins: ["*://www.threads.com/*"] };

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.runtime.openOptionsPage();
  } else if (details.reason === "update") {
    chrome.permissions.contains(THREADS_PERMISSIONS, (granted) => {
      const error = chrome.runtime.lastError;
      if (error) {
        console.warn(
          "[Objectivity on Threads] Permission check failed:",
          error.message,
        );
      }
      if (error || !granted) chrome.runtime.openOptionsPage();
    });
  }
});

chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});
