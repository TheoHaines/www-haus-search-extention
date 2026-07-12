const propertyExtractor = {
	extractFromPage() {
		const data = {
			nickname: "",
			address: "",
			url: window.location.href,
			tags: [],
			notes: "",
		};

		const hostname = window.location.hostname;

		if (hostname.includes("rightmove")) {
			data.nickname = this.extractRightmoveTitle();
			data.address = this.extractRightmoveAddress();
			data.tags = this.extractRightmoveTags();
			data.notes = this.extractRightmoveNotes();
		}
		if (hostname.includes("zoopla")) {
			data.nickname = this.extractZooplaTitle();
			data.address = this.extractZooplaAddress();
			data.tags = this.extractZooplaTags();
			data.notes = this.extractZooplaNotes();
		} else {
			data.nickname = this.extractGenericTitle();
			data.address = this.extractGenericAddress();
		}

		return data;
	},

	extractRightmoveTitle() {
		const titleEl = document.querySelector(
			'h1[data-monitor-testid="streetAddress"]',
		);
		if (titleEl) {
			const text = titleEl.textContent.trim();
			const parts = text.split(",");
			return parts[0] || text;
		}
		return "";
	},

	extractRightmoveAddress() {
		const addressEl = document.querySelector(
			'h1[data-monitor-testid="streetAddress"]',
		);
		if (addressEl) {
			return addressEl.textContent.trim();
		}
		return "";
	},

	extractRightmoveNotes() {
		const notes = [];

		const primaryPrice = document.querySelector(
			'[data-testid="primaryPrice"] span',
		);
		if (primaryPrice) {
			notes.push(primaryPrice.textContent.trim());
		}

		const secondaryPrice = document.querySelector(
			'[data-testid="secondaryPrice"]',
		);
		if (secondaryPrice) {
			notes.push(secondaryPrice.textContent.trim());
		}

		const depositElements = document.querySelectorAll("dt, dd");
		for (let i = 0; i < depositElements.length; i++) {
			const element = depositElements[i];
			if (element.textContent.includes("Deposit")) {
				if (element.nextElementSibling) {
					const depositValue =
						element.nextElementSibling.textContent.trim();
					notes.push(`Deposit: ${depositValue}`);
					break;
				}
			}
		}

		return notes.join("\n");
	},

	extractRightmoveTags() {
		const tags = [];

		const keyFeaturesEl = document.querySelector(
			'[data-testid="keyFeatures"]',
		);
		if (keyFeaturesEl) {
			const features = keyFeaturesEl.textContent.toLowerCase();

			if (features.includes("garden")) tags.push("garden");
			if (features.includes("parking")) tags.push("parking");
			if (features.includes("garage")) tags.push("garage");
			if (features.includes("new")) tags.push("new-build");
			if (features.includes("balcony")) tags.push("balcony");
			if (features.includes("patio")) tags.push("patio");
		}

		const furnishTypeElements = document.querySelectorAll("dt, dd");
		for (let i = 0; i < furnishTypeElements.length; i++) {
			const element = furnishTypeElements[i];
			if (element.textContent.includes("Furnish type")) {
				if (element.nextElementSibling) {
					const furnishType = element.nextElementSibling.textContent
						.trim()
						.toLowerCase();
					if (furnishType === "furnished") {
						tags.push("furnished");
					} else if (furnishType === "unfurnished") {
						tags.push("unfurnished");
					} else if (furnishType === "part furnished") {
						tags.push("part-furnished");
					}
					break;
				}
			}
		}

		return tags;
	},

	extractZooplaTitle() {
		const titleEl = document.querySelector("h1.page_titleWrapper__wBbCd");
		if (titleEl) {
			return titleEl.textContent.trim().split("\n")[0];
		}
		return "";
	},

	extractZooplaAddress() {
		const addressEl = document.querySelector(".page_address__sUwuW");
		return addressEl ? addressEl.textContent.trim() : "";
	},

	extractZooplaTags() {
		const tags = [];

		const tagsContainer = document.querySelector(".Tags_tagsList__2lsl4");
		if (tagsContainer) {
			const tagText = tagsContainer.textContent.toLowerCase();
			if (tagText.includes("furnished")) tags.push("furnished");
			if (tagText.includes("unfurnished")) tags.push("unfurnished");
			if (tagText.includes("part furnished")) tags.push("part-furnished");
		}

		const featuresText = document.querySelector(
			".Features_featuresList__tDAtY",
		);
		if (featuresText) {
			const text = featuresText.textContent.toLowerCase();
			if (text.includes("garden")) tags.push("garden");
			if (text.includes("parking")) tags.push("parking");
		}

		return tags;
	},

	extractZooplaNotes() {
		const notes = [];

		const priceEl = document.querySelector(".Price_price__725Mp");
		if (priceEl) {
			notes.push(priceEl.textContent.trim());
		}

		const altPriceEl = document.querySelector(".Price_priceAlt__Gfyi4");
		if (altPriceEl) {
			notes.push(altPriceEl.textContent.trim());
		}

		const ntsItems = document.querySelectorAll(
			".NtsInfo_ntsInfoListItem__4R0fo",
		);
		ntsItems.forEach((item) => {
			const title = item.querySelector(".NtsInfo_ntsItemTitle__CSiYU");
			const value = item.querySelector(
				".NtsInfo_ntsInfoItemTextWrapper__97xUn",
			);
			if (title && value && title.textContent.includes("Deposit")) {
				notes.push(`Deposit: ${value.textContent.trim()}`);
			}
		});

		return notes.join("\n");
	},
};

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === "extractPropertyData") {
		const data = propertyExtractor.extractFromPage();
		sendResponse(data);
	}
});
