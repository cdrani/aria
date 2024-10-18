import type { Settings } from '../types'

let lamejsUrl: string | null = null
let encoderWorker: Worker | null = null

export function initEncoderWorker() {
    if (encoderWorker) return
    const workerUrl = chrome.runtime.getURL('src/lib/encoder/worker.ts')
    encoderWorker = new Worker(workerUrl)
}

export async function encodeAudio(audioData: Blob, settings: Settings): Promise<Blob> {
    if (!encoderWorker) {
        throw new Error('Encoder worker not initialized')
    }

    try {
        const arrayBuffer = await audioData.arrayBuffer()
        const audioContext = new window.AudioContext()
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

        const channels = audioBuffer.numberOfChannels
        const audioDataArrays: Float32Array[] = []
        for (let i = 0; i < channels; i++) {
            audioDataArrays.push(audioBuffer.getChannelData(i))
        }

        return new Promise((resolve, reject) => {
            encoderWorker!.onmessage = (e) => {
                if (e.data.error) {
                    reject(new Error(e.data.error))
                } else {
                    resolve(e.data.blob)
                }
            }

            if (settings.format === 'mp3' && !lamejsUrl) {
                lamejsUrl = chrome.runtime.getURL('/src/lib/vendor/lamejs.min.js')
                encoderWorker!.postMessage({ action: 'setup', lamejsUrl })
            }

            encoderWorker!.postMessage({
                audioData: audioDataArrays,
                sampleRate: audioBuffer.sampleRate,
                numberOfChannels: channels,
                format: settings.format,
                quality: settings.quality
            })
        })
    } catch (error) {
        throw new Error(`Error preparing audio data: ${(error as Error).message}`)
    }
}

export function terminateEncoderWorker() {
    if (!encoderWorker) return
    encoderWorker.terminate()
    encoderWorker = null
}
