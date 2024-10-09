let audioStream = null
let mediaRecorder = null
let popupWindowId = null
let originalTabId = null

let settings = { muted: false, format: 'webm', quality: 128, microphoneId: null }

chrome.runtime.onInstalled.addListener(() => chrome.storage.sync.set({ settings }))

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === 'GET_CURRENT_TAB') {
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => sendResponse(tabs[0]))
        return true
    }

    if (request.action === 'GET_ORIGINAL_TAB') {
        chrome.tabs.get(originalTabId, tab => sendResponse(tab))
        return true
    }

    switch (request.action) {
        case 'GET_SETTINGS':
            sendResponse(settings)
            break
        case 'UPDATE_SETTINGS':
            settings = { ...settings, ...request.data }
            chrome.storage.sync.set({ settings })
            sendResponse({ success: true })
            break
    }

    return true // Keep the message channel open for async responses
})

chrome.action.onClicked.addListener(tab => {
    if (popupWindowId === null) {
        originalTabId = tab.id
        chrome.windows.create(
            {
                type: 'popup',
                width: 350,
                height: 375,
                url: `main.html?tabId=${tab.id}`,
            },
            window => {
                popupWindowId = window.id
            }
        )
    } else {
        chrome.windows.update(popupWindowId, { focused: true })
    }
})

chrome.windows.onRemoved.addListener(windowId => {
    if (windowId === popupWindowId) {
        popupWindowId = null
        originalTabId = null
    }
})

// Helper function to handle tab updates
function handleTabUpdate(tabId, changeInfo, tab) {
    if (changeInfo.status !== 'complete') return

    chrome.tabs.sendMessage(tabId, { action: 'TAB_UPDATED', data: tab })
}

// Set up tab update listener
chrome.tabs.onUpdated.addListener(handleTabUpdate)

// Clean up function to handle extension unload
function cleanup() {
    if (audioStream) audioStream.getTracks().forEach(track => track.stop())
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop()
}

// Listen for extension unload
chrome.runtime.onSuspend.addListener(cleanup)
