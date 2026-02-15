"use strict";

// --- i18n ---

const MESSAGES = {
  en: {
    lang_auto: "Auto-detect",
    provider_legend: "AI Provider",
    provider_chatgpt: "ChatGPT (temporary chat)",
    provider_claude: "Claude (incognito)",
    icon_action_legend: "Analysis button behavior",
    icon_action_menu: "Show menu to choose AI",
    icon_action_direct: "Open default AI directly",
    prompt_label: "Analysis prompt",
    prompt_hint:
      'Use <code>{post_content}</code> as a placeholder for the post text.',
    save: "Save",
    reset: "Reset to default",
    saved: "Saved.",
    reset_done: "Reset to default.",
  },
  "zh-TW": {
    lang_auto: "自動偵測",
    provider_legend: "AI 提供者",
    provider_chatgpt: "ChatGPT（暫時對話）",
    provider_claude: "Claude（無痕模式）",
    icon_action_legend: "分析按鈕行為",
    icon_action_menu: "顯示選單選擇 AI",
    icon_action_direct: "直接開啟預設 AI",
    prompt_label: "分析提示詞",
    prompt_hint:
      '使用 <code>{post_content}</code> 作為貼文內容的佔位符。',
    save: "儲存",
    reset: "恢復預設",
    saved: "已儲存。",
    reset_done: "已恢復預設。",
  },
  "zh-HK": {
    lang_auto: "自動偵測",
    provider_legend: "AI 提供者",
    provider_chatgpt: "ChatGPT（臨時對話）",
    provider_claude: "Claude（無痕模式）",
    icon_action_legend: "分析按鈕行為",
    icon_action_menu: "顯示選單揀選 AI",
    icon_action_direct: "直接開啟預設 AI",
    prompt_label: "分析提示詞",
    prompt_hint:
      '使用 <code>{post_content}</code> 作為帖文內容嘅佔位符。',
    save: "儲存",
    reset: "恢復預設",
    saved: "已儲存。",
    reset_done: "已恢復預設。",
  },
  ja: {
    lang_auto: "自動検出",
    provider_legend: "AI プロバイダー",
    provider_chatgpt: "ChatGPT（一時チャット）",
    provider_claude: "Claude（シークレット）",
    icon_action_legend: "分析ボタンの動作",
    icon_action_menu: "AI を選択するメニューを表示",
    icon_action_direct: "デフォルトの AI を直接開く",
    prompt_label: "分析プロンプト",
    prompt_hint:
      '<code>{post_content}</code> を投稿テキストのプレースホルダーとして使用します。',
    save: "保存",
    reset: "デフォルトに戻す",
    saved: "保存しました。",
    reset_done: "デフォルトに戻しました。",
  },
};

function detectLanguage() {
  const lang = navigator.language || "";
  if (lang.startsWith("zh-TW") || lang === "zh-Hant-TW") return "zh-TW";
  if (lang.startsWith("zh-HK") || lang === "zh-Hant-HK") return "zh-HK";
  if (lang.startsWith("zh")) return "zh-TW";
  if (lang.startsWith("ja")) return "ja";
  return "en";
}

let currentLang = "en";

function t(key) {
  return (MESSAGES[currentLang] && MESSAGES[currentLang][key]) ||
    MESSAGES.en[key] ||
    key;
}

function applyI18n() {
  for (const el of document.querySelectorAll("[data-i18n]")) {
    el.textContent = t(el.getAttribute("data-i18n"));
  }
  for (const el of document.querySelectorAll("[data-i18n-html]")) {
    el.innerHTML = t(el.getAttribute("data-i18n-html"));
  }
}

// --- Settings ---

const DEFAULT_PROMPT = `請搜尋網路上的資訊，詳細逐句分析從 Threads 上看到的以下內容。

「{post_content}」`;

const DEFAULT_PROVIDER = "chatgpt";
const DEFAULT_ICON_ACTION = "menu";

const languageEl = document.getElementById("language");
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

function showStatus(key) {
  statusEl.textContent = t(key);
  statusEl.hidden = false;
  setTimeout(() => {
    statusEl.hidden = true;
  }, 2000);
}

// Language selector changes UI immediately
languageEl.addEventListener("change", () => {
  const val = languageEl.value;
  currentLang = val === "auto" ? detectLanguage() : val;
  applyI18n();
});

// Load saved settings on open
chrome.storage.sync.get(
  ["prompt", "provider", "iconAction", "language"],
  (result) => {
    const langSetting = result.language ?? "auto";
    languageEl.value = langSetting;
    currentLang = langSetting === "auto" ? detectLanguage() : langSetting;
    applyI18n();

    promptEl.value = result.prompt ?? DEFAULT_PROMPT;
    setRadio(providerRadios, result.provider ?? DEFAULT_PROVIDER);
    setRadio(iconActionRadios, result.iconAction ?? DEFAULT_ICON_ACTION);
  },
);

saveBtn.addEventListener("click", () => {
  chrome.storage.sync.set(
    {
      prompt: promptEl.value,
      provider: getRadio(providerRadios, DEFAULT_PROVIDER),
      iconAction: getRadio(iconActionRadios, DEFAULT_ICON_ACTION),
      language: languageEl.value,
    },
    () => {
      showStatus("saved");
    },
  );
});

resetBtn.addEventListener("click", () => {
  chrome.storage.sync.remove(
    ["prompt", "provider", "iconAction", "language"],
    () => {
      promptEl.value = DEFAULT_PROMPT;
      setRadio(providerRadios, DEFAULT_PROVIDER);
      setRadio(iconActionRadios, DEFAULT_ICON_ACTION);
      languageEl.value = "auto";
      currentLang = detectLanguage();
      applyI18n();
      showStatus("reset_done");
    },
  );
});
