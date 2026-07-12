async function populateFormWithExtractedData() {
	console.log("[popup] populateFormWithExtractedData starting");

	chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
		if (!tabs[0]) {
			console.error("No active tab found");
			return;
		}

		const tabId = tabs[0].id;
		const hostname = new URL(tabs[0].url).hostname;

		console.log("[popup] Active tab hostname:", hostname);

		if (!hostname.includes("rightmove") && !hostname.includes("zoopla")) {
			console.warn("[popup] Unsupported website");
			return;
		}

		try {
			const results = await chrome.scripting.executeScript({
				target: { tabId: tabId },
				function: executeExtraction,
			});

			if (results && results[0] && results[0].result) {
				const data = results[0].result;
				console.log("[popup] received data:", data);

				document.getElementById("lead-nickname").value =
					data.nickname || "";
				document.getElementById("lead-address").value =
					data.address || "";
				document.getElementById("lead-url").value = data.url || "";
				document.getElementById("lead-notes").value = data.notes || "";

				if (data.tags && data.tags.length > 0) {
					document.getElementById("lead-tags").value =
						data.tags.join(", ");
				} else {
					document.getElementById("lead-tags").value = "";
				}

				console.log("[popup] form values set");
			}
		} catch (error) {
			console.error("Error injecting script:", error);
			sendMessageToContentScript(tabId);
		}
	});
}

function executeExtraction() {
	const data = {
		nickname: "",
		address: "",
		url: window.location.href,
		tags: [],
		notes: "",
	};

	const hostname = window.location.hostname;
	console.log("Hostname:", hostname);

	if (hostname.includes("rightmove")) {
		data.nickname = extractRightmoveTitle();
		data.address = extractRightmoveAddress();
		data.tags = extractRightmoveTags();
		data.notes = extractRightmoveNotes();
	} else if (hostname.includes("zoopla")) {
		data.nickname = extractZooplaTitle();
		data.address = extractZooplaAddress();
		data.tags = extractZooplaTags();
		data.notes = extractZooplaNotes();
	} else {
		data.nickname = extractGenericTitle();
		data.address = extractGenericAddress();
	}

	console.log("Final data:", data);
	return data;

	function extractRightmoveTitle() {
		const titleEl = document.querySelector(
			'h1.sZjlmYmhmcQWiJjxW26U, h1[data-monitor-testid="streetAddress"]',
		);
		if (titleEl) {
			const text = titleEl.textContent.trim();
			const parts = text.split(",");
			console.log("Title extracted:", parts[0] || text);
			return parts[0] || text;
		}
		console.warn("Title not found");
		return "";
	}

	function extractRightmoveAddress() {
		const addressEl = document.querySelector(
			'h1.sZjlmYmhmcQWiJjxW26U, h1[data-monitor-testid="streetAddress"]',
		);
		if (addressEl) {
			const address = addressEl.textContent.trim();
			console.log("Address extracted:", address);
			return address;
		}
		console.warn("Address not found");
		return "";
	}

	function extractRightmoveNotes() {
		const notes = [];

		const primaryPriceEl = document.querySelector(
			'[data-testid="primaryPrice"]',
		);
		if (primaryPriceEl) {
			const primarySpan = primaryPriceEl.querySelector("span");
			if (primarySpan) {
				const price = primarySpan.textContent.trim();
				notes.push(price);
				console.log("Primary price:", price);
			}
		}

		const secondaryPriceEl = document.querySelector(
			'[data-testid="secondaryPrice"]',
		);
		if (secondaryPriceEl) {
			const price = secondaryPriceEl.textContent.trim();
			notes.push(price);
			console.log("Secondary price:", price);
		}

		const depositElements = document.querySelectorAll("dt, dd");
		for (let i = 0; i < depositElements.length; i++) {
			const element = depositElements[i];
			if (element.textContent.toLowerCase().includes("deposit")) {
				const nextEl = element.nextElementSibling;
				if (nextEl) {
					const depositValue = nextEl.textContent.trim();
					notes.push(`Deposit: ${depositValue}`);
					console.log("Deposit:", depositValue);
					break;
				}
			}
		}

		const result = notes.join("\n").trim();
		console.log("Notes extracted:", result);
		return result;
	}

	function extractRightmoveTags() {
		const tags = [];

		const keyFeaturesEl = document.querySelector(
			'ul[data-testid="keyFeatures"], [data-testid="keyFeatures"]',
		);
		if (keyFeaturesEl) {
			const features = keyFeaturesEl.textContent.toLowerCase();

			if (features.includes("garden")) tags.push("garden");
			if (features.includes("parking")) tags.push("parking");
			if (features.includes("garage")) tags.push("garage");
			if (features.includes("new")) tags.push("new-build");
			if (features.includes("balcony")) tags.push("balcony");
			if (features.includes("patio")) tags.push("patio");
			if (features.includes("shared")) tags.push("shared");
			if (features.includes("en suite")) tags.push("en-suite");

			console.log("Key features found:", features.slice(0, 100));
		} else {
			console.warn("Key features element not found");
		}

		const furnishTypeElements = document.querySelectorAll("dt, dd");
		for (let i = 0; i < furnishTypeElements.length; i++) {
			const element = furnishTypeElements[i];
			const text = element.textContent.toLowerCase();
			if (text.includes("furnish")) {
				const nextEl = element.nextElementSibling;
				if (nextEl) {
					const furnishType = nextEl.textContent.trim().toLowerCase();
					if (furnishType === "furnished") {
						tags.push("furnished");
					} else if (furnishType === "unfurnished") {
						tags.push("unfurnished");
					} else if (furnishType.includes("part furnished")) {
						tags.push("part-furnished");
					}
					console.log("Furnish type:", furnishType);
					break;
				}
			}
		}

		console.log("Tags extracted:", tags);
		return tags;
	}

	function extractZooplaTitle() {
		const jsonScript = document.querySelector(
			'script[type="application/ld+json"]',
		);
		if (jsonScript) {
			try {
				const data = JSON.parse(jsonScript.textContent);
				if (data.name) {
					return data.name.split(" to rent")[0].trim();
				}
			} catch (e) {
				console.warn("Failed to parse JSON:", e);
			}
		}

		const h1 = document.querySelector("h1");
		return h1 ? h1.textContent.trim().split("\n")[0] : "";
	}

	function extractZooplaAddress() {
		const jsonScript = document.querySelector(
			'script[type="application/ld+json"]',
		);
		if (jsonScript) {
			try {
				const data = JSON.parse(jsonScript.textContent);
				if (data.name) {
					return data.name;
				}
			} catch (e) {
				console.warn("Failed to parse JSON:", e);
			}
		}

		const addressEl = document.querySelector("address");
		return addressEl ? addressEl.textContent.trim() : "";
	}

	function extractZooplaTags() {
		const tags = [];
		const pageText = document.body.textContent.toLowerCase();

		if (pageText.includes("unfurnished")) tags.push("unfurnished");
		if (pageText.includes("furnished")) tags.push("furnished");
		if (pageText.includes("garden")) tags.push("garden");
		if (pageText.includes("parking")) tags.push("parking");
		if (pageText.includes("garage")) tags.push("garage");

		return [...new Set(tags)];
	}

	function extractZooplaNotes() {
		const notes = [];
		const pageText = document.body.textContent;

		const pricePcmMatch = pageText.match(/£[\d,]+ pcm/);
		if (pricePcmMatch) {
			notes.push(pricePcmMatch[0]);
		}

		const pricePwMatch = pageText.match(/£[\d,]+ pw/);
		if (pricePwMatch) {
			notes.push(pricePwMatch[0]);
		}

		const depositMatch = pageText.match(/Deposit[:\s]+£[\d,]+/i);
		if (depositMatch) {
			notes.push(depositMatch[0]);
		}

		return notes.join("\n");
	}

	function extractGenericTitle() {
		return document.title.split("|")[0].trim();
	}

	function extractGenericAddress() {
		const addressPatterns = [
			document.querySelector("[itemprop='streetAddress']"),
			document.querySelector(".address"),
			document.querySelector("[data-address]"),
		];

		for (const el of addressPatterns) {
			if (el) {
				return el.textContent.trim();
			}
		}

		return "";
	}
}

function sendMessageToContentScript(tabId) {
	chrome.tabs.sendMessage(
		tabId,
		{ action: "extractPropertyData" },
		(response) => {
			if (chrome.runtime.lastError) {
				console.error(
					"Content script error:",
					chrome.runtime.lastError,
				);
				return;
			}

			if (response) {
				console.log(
					"[popup] received data from content script:",
					response,
				);

				document.getElementById("lead-nickname").value =
					response.nickname || "";
				document.getElementById("lead-address").value =
					response.address || "";
				document.getElementById("lead-url").value = response.url || "";
				document.getElementById("lead-notes").value =
					response.notes || "";

				if (response.tags && response.tags.length > 0) {
					document.getElementById("lead-tags").value =
						response.tags.join(", ");
				} else {
					document.getElementById("lead-tags").value = "";
				}

				console.log("[popup] form values set");
			}
		},
	);
}

const uiState = {
	currentState: "loading",
	hasSearch: false,
	currentTabUrl: "",

	setState(newState) {
		console.log("[uiState] setState:", {
			from: this.currentState,
			to: newState,
		});

		document.querySelectorAll(".state").forEach((state) => {
			state.classList.add("hidden");
		});

		const stateEl = document.getElementById(`${newState}-state`);
		if (stateEl) {
			stateEl.classList.remove("hidden");
		}

		this.currentState = newState;
	},
};

async function getActiveTabUrl() {
	return new Promise((resolve) => {
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			if (tabs.length > 0) {
				resolve(tabs[0].url);
			} else {
				resolve("");
			}
		});
	});
}

async function checkAuthAndSearch() {
	try {
		const token = await authService.getToken();
		const tabUrl = await getActiveTabUrl();
		uiState.currentTabUrl = tabUrl;

		console.log("[auth] token exists?", Boolean(token));
		console.log("[auth] active tab url:", tabUrl);

		if (!token) {
			uiState.setState("auth");
			return;
		}

		const search = await authService.getCurrentSearch(token);
		console.log("[auth] current search:", search);

		if (!search) {
			uiState.hasSearch = false;
			document
				.getElementById("no-search-message")
				.classList.remove("hidden");
			document.getElementById("login-form").classList.add("hidden");
			uiState.setState("auth");
			return;
		}

		uiState.hasSearch = true;
		populateFormWithExtractedData();
		uiState.setState("add-lead");
	} catch (error) {
		console.error("Auth check failed:", error);
		uiState.setState("auth");
	}
}

function setupLoginForm() {
	document
		.getElementById("login-submit")
		.addEventListener("submit", async (e) => {
			e.preventDefault();

			const email = document.getElementById("login-email").value;
			const password = document.getElementById("login-password").value;
			const errorEl = document.getElementById("login-error");

			errorEl.textContent = "";

			try {
				const result = await authService.login(email, password);
				await authService.saveCredentials(
					result.token,
					result.userId,
					result.nickname,
				);
				await checkAuthAndSearch();
			} catch (error) {
				errorEl.textContent = error.message;
			}
		});
}

function setupLogoutButtons() {
	const logoutBtn = document.getElementById("logout-btn");
	const logoutBtnLead = document.getElementById("logout-btn-lead");

	[logoutBtn, logoutBtnLead].forEach((btn) => {
		if (btn) {
			btn.addEventListener("click", async () => {
				await authService.clearCredentials();
				document
					.getElementById("no-search-message")
					.classList.add("hidden");
				document
					.getElementById("login-form")
					.classList.remove("hidden");
				uiState.setState("auth");
			});
		}
	});
}

function setupAutoDetectButton() {
	document.getElementById("auto-detect-btn").addEventListener("click", () => {
		console.log("[popup] Auto-detect button clicked");
		populateFormWithExtractedData();
	});
}

function setupAddLeadForm() {
	document
		.getElementById("add-lead-form")
		.addEventListener("submit", async (e) => {
			e.preventDefault();

			const errorEl = document.getElementById("add-lead-error");
			const successEl = document.getElementById("add-lead-success");
			errorEl.textContent = "";
			successEl.textContent = "";

			try {
				const token = await authService.getToken();
				const search = await authService.getCurrentSearch(token);

				if (!search) {
					throw new Error("No active Haus Search found");
				}

				const tags = document
					.getElementById("lead-tags")
					.value.split(",")
					.map((t) => t.trim())
					.filter((t) => t);

				const leadData = {
					hausSearchId: search.id,
					nickname: document.getElementById("lead-nickname").value,
					address: document.getElementById("lead-address").value,
					listingUrl: document.getElementById("lead-url").value,
					tags,
					notes: document.getElementById("lead-notes").value,
				};

				console.log("[popup] submit leadData:", leadData);

				const result = await authService.createPropertyLead(
					token,
					leadData,
				);

				successEl.textContent = "Lead added successfully!";

				document.getElementById("add-lead-form").reset();

				setTimeout(() => {
					populateFormWithExtractedData();
					successEl.textContent = "";
				}, 2000);

				console.log("[popup] createPropertyLead result:", result);
			} catch (error) {
				errorEl.textContent = error.message;
			}
		});
}

document.addEventListener("DOMContentLoaded", () => {
	setupLoginForm();
	setupLogoutButtons();
	setupAutoDetectButton();
	setupAddLeadForm();
	checkAuthAndSearch();
});
