const API_BASE_URL = "https://haus.theohaines.xyz/api";

const authService = {
	async login(email, password) {
		const response = await fetch(`${API_BASE_URL}/auth/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password }),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || "Login failed");
		}

		return await response.json();
	},

	async getCurrentSearch(token) {
		const response = await fetch(`${API_BASE_URL}/account/current-search`, {
			headers: { Authorization: `Bearer ${token}` },
		});

		if (response.status === 404) {
			return null;
		}

		if (!response.ok) {
			throw new Error("Failed to fetch search");
		}

		return await response.json();
	},

	async createPropertyLead(token, data) {
		const response = await fetch(`${API_BASE_URL}/property-leads`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || "Failed to create lead");
		}

		return await response.json();
	},

	async getToken() {
		return new Promise((resolve) => {
			chrome.storage.local.get(["token"], (result) => {
				resolve(result.token || null);
			});
		});
	},

	async saveCredentials(token, userId, nickname) {
		return new Promise((resolve) => {
			chrome.storage.local.set({ token, userId, nickname }, resolve);
		});
	},

	async clearCredentials() {
		return new Promise((resolve) => {
			chrome.storage.local.clear(resolve);
		});
	},
};
