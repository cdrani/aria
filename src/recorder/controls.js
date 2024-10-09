import {
    updateDownloadLink,
    resetRecordButton,
    showRecordingResult,
    updateRecordingProgress,
    showRecordingProgress,
} from './ui'

let isRecording = false
let audioStream = null
let mediaRecorder = null
let audioChunks = []
let recordedBlob = null
let recordingType = 'tab'

export async function toggleRecording(type, originalTab) {
    isRecording = !isRecording
    recordingType = type

    const button = document.getElementById(`recorder__${type}__button`)
    button.textContent = isRecording ? 'Stop' : 'Start'
    button.classList.remove(isRecording ? 'primary' : 'danger')
    button.classList.add(isRecording ? 'danger' : 'primary')

    await (isRecording ? startRecording(type, originalTab) : stopRecording())
}

async function getTabAudioStream(originalTab) {
    const streamId = await new Promise((resolve, reject) => {
        chrome.tabCapture.getMediaStreamId({ targetTabId: originalTab.id }, streamId => {
            const error = chrome.runtime?.lastError
            error ? reject(error) : resolve(streamId)
        })
    })

    return await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: streamId } },
    })
}

function initMediaRecorder(quality) {
    const options = { mimeType: 'audio/webm', audioBitsPerSecond: quality * 1000 }
    mediaRecorder = new MediaRecorder(audioStream, options)
    audioChunks = []

    mediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data)
        updateRecordingProgress(audioChunks.length)
    }

    mediaRecorder.onstop = () => {
        audioStream.getTracks().forEach(track => track.stop())
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
        const audioUrl = URL.createObjectURL(audioBlob)
        showRecordingResult(audioUrl, 'webm')
    }

    mediaRecorder.start(1000)
    showRecordingProgress()
}

export async function startRecording(type, originalTab) {
    try {
        audioStream = await (type == 'tab'
            ? getTabAudioStream(originalTab)
            : navigator.mediaDevices.getUserMedia({ audio: true }))

        const audioContext = new AudioContext()
        const source = audioContext.createMediaStreamSource(audioStream)
        source.connect(audioContext.destination)

        initMediaRecorder(settings?.quality || 128)
        isRecording = true
    } catch (error) {
        console.error('Error starting recording:', error)
        isRecording = false
        resetRecordButton(type)
    }
}

export async function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        return new Promise(resolve => {
            mediaRecorder.onstop = async () => {
                audioStream.getTracks().forEach(track => track.stop())
                recordedBlob = new Blob(audioChunks, { type: 'audio/webm' })
                await updateDownloadLink(recordedBlob)
                resolve()
            }
            mediaRecorder.stop()
        })
    }
}
