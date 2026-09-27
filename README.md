# Objectivity on Threads

一款瀏覽器擴充套件，在每則 [Threads](https://www.threads.com/) 貼文旁加入分析按鈕，將貼文內容送到 AI 服務進行事實查核。使用無痕（暫時對話）模式，避免 AI 受到先前對話記憶的影響，確保每次分析都是獨立且客觀的。

本套件在開發過程中重度使用大型語言模型（LLM）輔助。

## Supported AI services

目前支援以下 AI 服務：

* ChatGPT
* Claude
* Perplexity

可透過分析按鈕的選單選擇 AI 服務，或在設定頁指定預設 AI，並將按鈕行為設為「直接開啟預設 AI」。

## Installation

* https://chromewebstore.google.com/detail/objectivity-on-threads/degfggbekbomcgecdkaekahlhdpmnndc
* https://addons.mozilla.org/en-US/firefox/addon/objectivity-on-threads/

安裝後會自動開啟設定頁，檢查 Threads、ChatGPT、Claude 與 Perplexity 的存取權限。若權限不足，請按「授權網站存取」並在瀏覽器提示中允許存取，再重新整理 Threads 與已開啟的 AI 網站頁面。更新後若缺少任一網站的權限，也會自動開啟設定頁；之後也可以點擊擴充套件圖示，確認或補上權限。

## Deployment

使用 `web-ext` 與 `chrome-webstore-upload-cli` 更新既有的商店項目。需要 GNU Make、`jq`、`zip`、Node.js 22 以上及 npm；發布工具會透過 `npx` 自動下載。

先建立本機設定檔，再填入下方說明的憑證：

```sh
cp .env.example .env
chmod 600 .env
```

`.env` 已排除在 Git 之外，也不會放進擴充套件。只發布其中一個瀏覽器時，只需填入該商店的欄位。

```sh
make                 # Build both ZIP files locally
make deploy          # Submit updates to AMO and Chrome Web Store
make deploy-firefox  # Submit only the Firefox update
make deploy-chrome   # Upload and publish only the Chrome update
make firefox-sign    # Alias for deploy-firefox
```

每次發布前，請先提高 `src/manifest.json` 的 `version`。`make deploy` 會實際送出商店更新；Firefox 使用 `listed` 管道，送出後不等待審核，Chrome 則會上傳並提交發布。上架時間依各商店的審核結果而定。建置與簽署產物都放在 `build/`，ZIP 檔放在專案根目錄，執行 `make clean` 可清除。

### Firefox / AMO credentials

1. 使用有權管理本套件的 Mozilla 帳號登入 [AMO API credentials](https://addons.mozilla.org/developers/addon/api/key/)，產生 API 憑證。
2. 將 JWT issuer 填入 `.env` 的 `WEB_EXT_API_KEY`，JWT secret 填入 `WEB_EXT_API_SECRET`。

`web-ext` 會使用 manifest 中的 `objectivity-on-threads@example.com` 更新既有項目，不需另外設定 AMO 的數字 ID。參考 [web-ext sign 官方文件](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#web-ext-sign)。

### Chrome Web Store credentials

以下步驟依據 [Chrome Web Store API 官方文件](https://developer.chrome.com/docs/webstore/using-api)：

1. 確認有權管理本套件的 Google 帳號已啟用兩步驟驗證。在 [Google Cloud Console](https://console.cloud.google.com/) 建立或選擇專案，啟用 **Chrome Web Store API**。
2. 設定 OAuth consent screen，選擇 **External**，填入應用程式資訊。若使用 **Testing** 狀態，將發布用的 Google 帳號加入 **Test users**。
3. 建立 **OAuth client ID**，應用程式類型選 **Web application**，在 **Authorized redirect URIs** 加入 `https://developers.google.com/oauthplayground`。將取得的 Client ID 與 Client secret 分別填入 `CHROME_CLIENT_ID`、`CHROME_CLIENT_SECRET`。
4. 開啟 [OAuth Playground](https://developers.google.com/oauthplayground)，在右上角設定勾選 **Use your own OAuth credentials**，輸入剛才的 Client ID 與 Client secret。
5. 在 **Input your own scopes** 輸入 `https://www.googleapis.com/auth/chromewebstore`，按 **Authorize APIs**，以有權管理本套件的帳號授權。接著按 **Exchange authorization code for tokens**，將 **Refresh token** 填入 `CHROME_REFRESH_TOKEN`。
6. 在 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) 的 **Publisher > Settings** 取得 Publisher ID，填入 `CHROME_PUBLISHER_ID`。若有多個 Publisher，請選擇本套件所屬的項目。

`CHROME_EXTENSION_ID` 已預填本套件的 `degfggbekbomcgecdkaekahlhdpmnndc`。

External 應用程式在 **Testing** 狀態下取得的 refresh token 會在 7 天後到期。若要持續使用，請先將 OAuth 應用程式切換為 **In production**，再重新授權取得 token。參考 [Google refresh token 到期規則](https://developers.google.com/identity/protocols/oauth2#expiration)。

## License

[MIT](LICENSE)
