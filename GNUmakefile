VERSION := $(shell jq -r .version src/manifest.json)
NAME := objectivity-on-threads

SRC_FILES := src/manifest.json src/background.js src/autosubmit.js src/content.js src/content.css src/options.html src/options.js src/options.css src/icons/icon16.svg src/icons/icon48.svg src/icons/icon128.svg

CHROME_ZIP := $(NAME)-chrome-$(VERSION).zip
FIREFOX_ZIP := $(NAME)-firefox-$(VERSION).zip

CHROME_BUILD := build/chrome
FIREFOX_BUILD := build/firefox

.PHONY: all clean chrome firefox

all: chrome firefox

chrome: $(CHROME_ZIP)

firefox: $(FIREFOX_ZIP)

$(CHROME_ZIP): $(SRC_FILES)
	rm -rf $(CHROME_BUILD)
	mkdir -p $(CHROME_BUILD)/icons
	cp src/background.js src/autosubmit.js src/content.js src/content.css src/options.html src/options.js src/options.css $(CHROME_BUILD)/
	cp src/icons/*.svg $(CHROME_BUILD)/icons/
	jq 'del(.browser_specific_settings)' src/manifest.json > $(CHROME_BUILD)/manifest.json
	cd $(CHROME_BUILD) && zip -r ../../$@ .

$(FIREFOX_ZIP): $(SRC_FILES)
	rm -rf $(FIREFOX_BUILD)
	mkdir -p $(FIREFOX_BUILD)/icons
	cp src/background.js src/autosubmit.js src/content.js src/content.css src/options.html src/options.js src/options.css $(FIREFOX_BUILD)/
	cp src/icons/*.svg $(FIREFOX_BUILD)/icons/
	jq '.background = {"scripts": [.background.service_worker]}' src/manifest.json > $(FIREFOX_BUILD)/manifest.json
	cd $(FIREFOX_BUILD) && zip -r ../../$@ .

clean:
	rm -rf build $(NAME)-chrome-*.zip $(NAME)-firefox-*.zip
