import { updateDownloadLinkUI } from '../recorder/ui'

let encoderWorker = null

export function initEncoderWorker() {
    if (encoderWorker) return // Prevents multiple workers from being created

    const workerUrl = chrome.runtime.getURL('/src/encoder/worker.js')
    const lameUrl = chrome.runtime.getURL('/lib/lamejs.min.js')
    encoderWorker = new Worker(workerUrl) // Initializes a new Web Worker
    encoderWorker.postMessage({ action: 'init', lameUrl }) // Sends the LAME.js library URL to the worker

    encoderWorker.onmessage = messageHandler // Handle messages from the worker
}

function messageHandler(e) {
    if (e.data.action === 'mp3Converted') {
        const mp3Blob = new Blob(e.data.data, { type: 'audio/mpeg' })
        updateDownloadLinkUI(mp3Blob, 'audio/mpeg') // Updates the UI with the mp3 file
    }
}

export function convertToMp3(blob) {
    // This function sends the audio data to the worker for MP3 conversion
    const audioContext = new AudioContext()

    blob.arrayBuffer().then(arrayBuffer => {
        audioContext.decodeAudioData(arrayBuffer).then(audioBuffer => {
            encoderWorker.postMessage({
                action: 'convertToMp3',
                sampleRate: audioBuffer.sampleRate,
                channelData: audioBuffer.getChannelData(0),
            })
        })
    })
}
