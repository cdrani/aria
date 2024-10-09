let audioStream = null
let mediaRecorder = null
let audioChunks = []
let settings = { includeSystemAudio: false, format: 'webm', quality: 128, microphoneId: null }

chrome.runtime.onInstalled.addListener(() => chrome.storage.local.set({ settings }))

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
            chrome.storage.local.set({ settings })
            sendResponse({ success: true })
            break
        case 'START_RECORDING':
            startRecording(request.data, sendResponse)
            return true
        case 'STOP_RECORDING':
            stopRecording(sendResponse)
            return true
        case 'TOGGLE_TAB_MUTE':
            chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                if (tabs[0]) {
                    chrome.tabs.update(tabs[0].id, { muted: request.mute }, updatedTab => {
                        if (chrome.runtime.lastError) {
                            sendResponse({ error: chrome.runtime.lastError.message })
                        } else {
                            sendResponse({ success: true })
                        }
                    })
                } else {
                    sendResponse({ error: 'No active tab found' })
                }
            })
            return true
    }
})

function sendMessageToPopup(message) {
    chrome.runtime.sendMessage(message, response => {
        if (chrome.runtime.lastError) {
            // Ignore the error if the popup is closed
            console.log("Popup is closed, couldn't send message")
        }
    })
}

let popupWindowId = null
let originalTabId = null

chrome.action.onClicked.addListener(tab => {
    if (popupWindowId === null) {
        originalTabId = tab.id
        chrome.windows.create(
            {
                url: `main.html?tabId=${tab.id}`,
                type: 'popup',
                width: 350,
                height: 375,
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

async function startRecording(data, sendResponse) {
    try {
        if (data.type === 'tab') {
            chrome.tabCapture.capture({ audio: true, video: false }, stream => {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError)
                    sendResponse({ success: false, error: chrome.runtime.lastError.message })
                    return
                }
                audioStream = stream
                initializeMediaRecorder(sendResponse)
            })
        } else if (data.type === 'microphone') {
            try {
                audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
                initializeMediaRecorder(sendResponse)
            } catch (error) {
                console.error('Error accessing microphone:', error)
                sendResponse({ success: false, error: error.message })
            }
        }
    } catch (error) {
        console.error('Error starting recording:', error)
        sendResponse({ success: false, error: error.message })
    }
}

function initializeMediaRecorder(sendResponse) {
    mediaRecorder = new MediaRecorder(audioStream, { mimeType: 'audio/webm' })
    audioChunks = []

    mediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data)
        sendMessageToPopup({
            action: 'RECORDING_PROGRESS',
            data: { size: audioChunks.length },
        })
    }

    mediaRecorder.onstop = () => audioStream.getTracks().forEach(track => track.stop())

    mediaRecorder.start(1000)
    sendResponse({ success: true })
}

function stopRecording(sendResponse) {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop()
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
            processAudio(audioBlob, settings.format, sendResponse)
        }
    } else {
        sendResponse({ success: false, error: 'No active recording' })
    }
}

function processAudio(audioBlob, format, sendResponse) {
    chrome.storage.sync.get(['quality'], result => {
        const quality = result.quality || 128 // Default to 128 if not set

        if (format === 'webm') {
            const audioUrl = URL.createObjectURL(audioBlob)
            sendResponse({ success: true, audioUrl, format: 'webm' })
            saveAudio(audioUrl, 'webm')
            return
        }

        const fileReader = new FileReader()
        fileReader.onload = event => {
            const arrayBuffer = event.target.result
            const audioContext = new (window.AudioContext || window.webkitAudioContext)()
            audioContext.decodeAudioData(arrayBuffer, audioBuffer => {
                const worker = new Worker('popup/worker.js')
                worker.onmessage = e => {
                    if (e.data.action === 'progress') {
                        sendMessageToPopup({
                            action: 'ENCODING_PROGRESS',
                            data: { progress: e.data.progress },
                        })
                    } else if (e.data.action === 'complete') {
                        const audioUrl = URL.createObjectURL(e.data.blob)
                        sendResponse({ success: true, audioUrl, format: e.data.format })
                        saveAudio(audioUrl, e.data.format)
                    }
                }
                worker.postMessage({
                    quality,
                    audioBuffer,
                    sampleRate: audioBuffer.sampleRate,
                    action: format === 'mp3' ? 'encodeMP3' : 'encodeWAV',
                })
            })
        }
        fileReader.readAsArrayBuffer(audioBlob)
    })
}

function saveAudio(audioUrl, format) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `recording_${timestamp}.${format}`
    chrome.downloads.download({ url: audioUrl, filename, saveAs: true })
}

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
