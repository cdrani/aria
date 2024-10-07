import { createTabInfo } from './tab'
import { createSettings } from './settings'
import { createRecorder } from './recorder'

export function setupUI() {
    const root = document.getElementById('root')
    const extension = createExtension()
    root.appendChild(extension)
    initExtension()
}

function createExtension() {
    const extension = document.createElement('div')
    extension.className = 'extension'
    extension.appendChild(createContent())
    return extension
}

function createContent() {
    const content = document.createElement('div')
    content.className = 'content'
    content.appendChild(createTabInfo())
    content.appendChild(createSettings())
    content.appendChild(createRecorder())
    return content
}

function initExtension() {
    chrome.runtime.sendMessage({ action: 'GET_ORIGINAL_TAB' }, tab => {
        document.getElementById('url-content').textContent = tab.url
        document.getElementById('title-content').value = tab.title
    })

    const formatSelect = document.getElementById('formatSelect')
    formatSelect.addEventListener('change', event => {
        const selectedFormat = event.target.value
        chrome.runtime.sendMessage({
            action: 'UPDATE_SETTINGS',
            data: { format: selectedFormat },
        })
    })
}
