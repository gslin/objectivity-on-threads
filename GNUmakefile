VERSION := $(shell jq -r .version src/manifest.json)
NAME := objectivity-on-threads

SRC_FILES := src/manifest.json src/background.js src/autosubmit.js src/content.js src/content.css src/options.html src/options.js src/options.css src/icons/icon16.png src/icons/icon48.png src/icons/icon128.png

CHROME_ZIP := $(NAME)-chrome-$(VERSION).zip
FIREFOX_ZIP := $(NAME)-firefox-$(VERSION).zip

CHROME_BUILD := build/chrome
FIREFOX_BUILD := build/firefox

.PHONY: all clean chrome firefox deploy deploy-firefox deploy-chrome firefox-sign

all: chrome firefox

chrome: $(CHROME_ZIP)

firefox: $(FIREFOX_ZIP)

$(CHROME_ZIP): $(SRC_FILES)
	rm -rf $(CHROME_BUILD)
	mkdir -p $(CHROME_BUILD)/icons
	cp src/background.js src/autosubmit.js src/content.js src/content.css src/options.html src/options.js src/options.css $(CHROME_BUILD)/
	cp src/icons/*.png $(CHROME_BUILD)/icons/
	jq 'del(.browser_specific_settings)' src/manifest.json > $(CHROME_BUILD)/manifest.json
	cd $(CHROME_BUILD) && zip -r ../../$@ .

$(FIREFOX_ZIP): $(SRC_FILES)
	rm -rf $(FIREFOX_BUILD)
	mkdir -p $(FIREFOX_BUILD)/icons
	cp src/background.js src/autosubmit.js src/content.js src/content.css src/options.html src/options.js src/options.css $(FIREFOX_BUILD)/
	cp src/icons/*.png $(FIREFOX_BUILD)/icons/
	# Firefox 109-127 reads optional hosts from optional_permissions.
	jq '.background = {"scripts": [.background.service_worker]} | .optional_permissions = .optional_host_permissions | del(.optional_host_permissions)' src/manifest.json > $(FIREFOX_BUILD)/manifest.json
	cd $(FIREFOX_BUILD) && zip -r ../../$@ .

deploy-firefox: firefox
	@if [ ! -f .env ]; then echo 'Missing .env. Copy .env.example to .env and fill in credentials.' >&2; exit 1; fi
	@set -a && . ./.env && set +a && \
	if [ -z "$$WEB_EXT_API_KEY" ] || [ -z "$$WEB_EXT_API_SECRET" ]; then \
		echo 'WEB_EXT_API_KEY and WEB_EXT_API_SECRET must be set in .env' >&2; exit 1; \
	fi && \
	npx --yes web-ext@10.7.0 sign --source-dir=$(FIREFOX_BUILD) --artifacts-dir=build/web-ext-artifacts --channel=listed --approval-timeout=0

deploy-chrome: chrome
	@if [ ! -f .env ]; then echo 'Missing .env. Copy .env.example to .env and fill in credentials.' >&2; exit 1; fi
	@set -a && . ./.env && set +a && \
	if [ -z "$$CHROME_CLIENT_ID" ] || [ -z "$$CHROME_CLIENT_SECRET" ] || [ -z "$$CHROME_REFRESH_TOKEN" ] || [ -z "$$CHROME_PUBLISHER_ID" ] || [ -z "$$CHROME_EXTENSION_ID" ]; then \
		echo 'CHROME_CLIENT_ID, CHROME_CLIENT_SECRET, CHROME_REFRESH_TOKEN, CHROME_PUBLISHER_ID, and CHROME_EXTENSION_ID must be set in .env' >&2; exit 1; \
	fi && \
	CLIENT_ID="$$CHROME_CLIENT_ID" \
	CLIENT_SECRET="$$CHROME_CLIENT_SECRET" \
	REFRESH_TOKEN="$$CHROME_REFRESH_TOKEN" \
	PUBLISHER_ID="$$CHROME_PUBLISHER_ID" \
	npx --yes chrome-webstore-upload-cli@4.0.1 --source $(CHROME_ZIP) --extension-id "$$CHROME_EXTENSION_ID"

deploy: deploy-firefox deploy-chrome

firefox-sign: deploy-firefox

clean:
	rm -rf build $(NAME)-chrome-*.zip $(NAME)-firefox-*.zip
