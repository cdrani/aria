import type { Settings } from './lib/types';

let settings: Settings = {
	muted: false,
	format: 'webm',
	quality: 128,
	microphoneId: null
};

chrome.runtime.onInstalled.addListener(() => {
	chrome.storage.sync.set({ settings });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === 'GET_SETTINGS') {
		chrome.storage.sync.get('settings', (result) => {
			sendResponse(result.settings || settings);
		});
		return true;
	}

	if (request.action === 'UPDATE_SETTINGS') {
		settings = { ...settings, ...request.data };
		chrome.storage.sync.set({ settings });
		sendResponse({ success: true });
		return true;
	}
});
