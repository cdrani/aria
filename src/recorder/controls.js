import {
    hideWaveform,
    updateWavesurfer,
    updateDownloadLink,
    resetRecordButton,
    showRecordingResult,
    updateRecordingProgress,
    showRecordingProgress,
    updateRecordingButtonState,
} from './ui'

let isRecording = false
let isPaused = false
let audioStream = null
let mediaRecorder = null
let audioChunks = []
let recordedBlob = null
let recordingType = 'tab'

export async function toggleRecording(type, originalTab, discard = false) {
    if (discard) return discardRecording()

    if (!isRecording) {
        isRecording = true
        isPaused = false
        recordingType = type
        await startRecording(type, originalTab)
    } else if (isPaused) {
        isPaused = false
        mediaRecorder.resume()
    } else {
        isPaused = true
        mediaRecorder.pause()
    }

    updateRecordingButtonState(isRecording, isPaused, type)
}

async function getTabAudioStream(originalTab, muted) {
    const streamId = await new Promise((resolve, reject) => {
        chrome.tabCapture.getMediaStreamId({ targetTabId: originalTab.id }, streamId => {
            const error = chrome.runtime?.lastError
            error ? reject(error) : resolve(streamId)
        })
    })

    const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: streamId } },
    })

    stream.getAudioTracks().forEach(track => (track.enabled = !muted))

    return stream
}

function initMediaRecorder(quality) {
    const options = { mimeType: 'audio/webm', audioBitsPerSecond: quality * 1000 }
    mediaRecorder = new MediaRecorder(audioStream, options)
    audioChunks = []

    mediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data)
        updateRecordingProgress(audioChunks.length)

        // Update Wavesurfer with the current recording
        const currentBlob = new Blob(audioChunks, { type: 'audio/webm' })
        updateWavesurfer(currentBlob)
    }

    mediaRecorder.onstop = () => {
        audioStream.getTracks().forEach(track => track.stop())
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
        const audioUrl = URL.createObjectURL(audioBlob)
        showRecordingResult(audioUrl, 'webm')
    }

    mediaRecorder.onpause = () => {
        console.log('Recording paused')
    }

    mediaRecorder.onresume = () => {
        console.log('Recording resumed')
    }

    mediaRecorder.start(0)
    showRecordingProgress()
}

export async function startRecording(type, originalTab) {
    try {
        const settings = await new Promise(resolve =>
            chrome.runtime.sendMessage({ action: 'GET_SETTINGS' }, resolve)
        )
        audioStream = await (type == 'tab'
            ? getTabAudioStream(originalTab, settings.muted)
            : navigator.mediaDevices.getUserMedia({
                  audio: {
                      deviceId: settings.microphoneId
                          ? { exact: settings.microphoneId }
                          : undefined,
                  },
              }))

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
    if (!(mediaRecorder && mediaRecorder.state !== 'inactive')) return

    isRecording = false
    isPaused = false
    return new Promise(resolve => {
        mediaRecorder.onstop = async () => {
            audioStream.getTracks().forEach(track => track.stop())
            recordedBlob = new Blob(audioChunks, { type: 'audio/webm' })
            await updateDownloadLink(recordedBlob)
            updateRecordingButtonState(isRecording, isPaused, recordingType)
            resolve()
        }
        mediaRecorder.stop()
    })
}

export function discardRecording() {
    if (isRecording) mediaRecorder.stop()

    isRecording = false
    isPaused = false
    audioChunks = []

    if (audioStream) audioStream.getTracks().forEach(track => track.stop())

    resetRecordButton(recordingType)
    updateRecordingButtonState(isRecording, isPaused, recordingType)

    // Clear the recorder UI and reset Wavesurfer
    const recorder = document.querySelector('.recorder')
    recorder.innerHTML = ''
    updateWavesurfer(new Blob([], { type: 'audio/webm' }))
    hideWaveform()
}
