import type { Settings } from './lib/types'

let currentTab: chrome.tabs.Tab | undefined
let uiWindow: chrome.windows.Window | undefined

let settings: Settings = {
    muted: false,
    format: 'webm',
    quality: 128,
    microphone: {
        id: null,
        label: null
    }
}

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ settings })
})

function getCurrentTab() {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        const tab = tabs.find((tab) => tab.url && !tab.url.startsWith('chrome'))
        if (tab) currentTab = tab
    })
}

chrome.action.onClicked.addListener((tab) => {
    parentWindowId = tab.windowId

    chrome.windows.create({
        url: chrome.runtime.getURL('src/index.html'),
        type: 'popup',
        width: 350,
        height: 350,
        state: 'minimized',
    })
})

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === 'GET_SETTINGS') {
        chrome.storage.sync.get('settings', (result) => {
            sendResponse(result.settings || settings)
        })
        return true
    }

    if (request.action === 'GET_CURRENT_TAB') {
        getCurrentTab()
        sendResponse(currentTab)
        return true
    }

    if (request.action !== 'UPDATE_SETTINGS') return

    settings = { ...settings, ...request.data }
    chrome.storage.sync.set({ settings })
    sendResponse({ success: true })
    return true
})

chrome.action.onClicked.addListener(() => {
    if (uiWindow?.id && !chrome.runtime.lastError) {
        chrome.windows.update(uiWindow.id, { focused: true })
    } else {
        chrome.windows.create(
            {
                type: 'popup',
                width: 350,
                height: 400,
                url: `src/index.html?tabId=${currentTab?.id}`
            },
            (window) => {
                uiWindow = window
            }
        )
    }
})

chrome.tabs.onActivated.addListener(() => getCurrentTab())

chrome.windows.onRemoved.addListener((windowId) => {
    if (uiWindow?.id === windowId) {
        uiWindow = undefined
    }
})
