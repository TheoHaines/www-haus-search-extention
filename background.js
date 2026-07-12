chrome.runtime.onInstalled.addListener(() => {
	console.log("Haus Search extension installed");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === "logout") {
		chrome.storage.local.clear(() => {
			sendResponse({ success: true });
		});
	}
});
