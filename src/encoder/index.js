import { updateDownloadLinkUI } from '../recorder/ui'

let audioContext = null
let encoderWorker = null

function createAudioContext() {
    if (audioContext) return
    audioContext = new AudioContext()
}

export function initEncoderWorker() {
    if (encoderWorker) return

    const workerUrl = chrome.runtime.getURL('/encoder/worker.js')
    const lameUrl = chrome.runtime.getURL('/lib/lamejs.min.js')
    encoderWorker = new Worker(workerUrl)

    encoderWorker.postMessage({ action: 'init', lameUrl }) // Send LAME.js library URL to worker

    encoderWorker.onmessage = messageHandler

    if (!audioContext) audioContext = new AudioContext()
}

function messageHandler(e) {
    if (e.data.action === 'mp3Converted') {
        const mp3Blob = new Blob(e.data.data, { type: 'audio/mpeg' })
        updateDownloadLinkUI(mp3Blob, 'mp3')
        cleanupResources()
    } else if (e.data.action === 'error') {
        console.error('Error in worker:', e.data.message)
    }
}

// Reusable function to send audio data to worker for MP3 conversion
export function convertToMp3(blob, quality) {
    if (!encoderWorker) initEncoderWorker()

    blob.arrayBuffer().then(arrayBuffer => {
        audioContext
            .decodeAudioData(arrayBuffer)
            .then(audioBuffer => {
                const sampleRate = audioBuffer.sampleRate
                const [leftChannelData, rightChannelData] = [
                    audioBuffer.getChannelData(0),
                    audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : null,
                ]

                encoderWorker.postMessage(
                    {
                        action: 'convertToMp3',
                        sampleRate,
                        leftChannelData,
                        rightChannelData,
                        bitrate: quality,
                    },
                    [
                        leftChannelData.buffer,
                        rightChannelData ? rightChannelData.buffer : null,
                    ].filter(Boolean)
                )
            })
            .catch(err => console.error('Error decoding audio data:', err))
    })
}

// Cleanup resources after conversion or in case of errors
export function cleanupResources() {
    encoderWorker?.terminate() // Terminate worker when no longer needed
    encoderWorker = null

    audioContext
        ?.close()
        .then(() => (audioContext = null))
        .catch(err => console.error('Error closing AudioContext:', err))
}
