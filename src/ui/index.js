import { createTabInfo } from './tab'
import { createSettings } from './settings'
import { createRecorder } from './recorder'

export async function setupUI() {
    const root = document.getElementById('root')
    const extension = await createExtension()
    root.appendChild(extension)
    await initExtension()
}

async function createExtension() {
    const extension = document.createElement('div')
    extension.className = 'extension'
    extension.appendChild(await createContent())
    return extension
}

function createProgress() {
    const progress = document.createElement('div')
    progress.id = 'progress'
    progress.style.display = 'none'
    const waveSurfer = document.createElement('div')
    waveSurfer.id = 'waveform'
    progress.appendChild(waveSurfer)
    return progress
}

async function createContent() {
    const content = document.createElement('div')
    content.className = 'content'
    const settings = await new Promise(resolve =>
        chrome.runtime.sendMessage({ action: 'GET_SETTINGS' }, resolve)
    )
    content.appendChild(createTabInfo())
    content.appendChild(createSettings(settings))
    content.appendChild(createProgress())
    content.appendChild(createRecorder())
    return content
}

async function initExtension() {
    chrome.runtime.sendMessage({ action: 'GET_ORIGINAL_TAB' }, tab => {
        document.getElementById('url-content').textContent = tab.url
        document.getElementById('title-content').value = tab.title
    })
}
