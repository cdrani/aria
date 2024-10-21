import type { Settings } from './lib/types'

let parentWindowId: number | undefined
let currentTab: chrome.tabs.Tab | undefined

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
    return new Promise<chrome.tabs.Tab | undefined>((resolve) => {
        if (!parentWindowId) {
            resolve(undefined)
            return
        }

        chrome.tabs.query({ active: true, windowId: parentWindowId }, (tabs: chrome.tabs.Tab[]) => {
            const tab = tabs.find((tab) => tab.url && !tab.url.startsWith('chrome'))
            chrome.runtime.sendMessage({ action: 'TAB_UPDATED', data: tab })
            resolve(tab)
        })
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
        getCurrentTab().then((tab) => {
            currentTab = tab
            sendResponse(currentTab)
        })
        return true
    }

    if (request.action !== 'UPDATE_SETTINGS') return

    settings = { ...settings, ...request.data }
    chrome.storage.sync.set({ settings })
    sendResponse({ success: true })
    return true
})
