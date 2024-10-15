import {
    hideWaveform,
    updateWavesurfer,
    resetRecordButton,
    updateDownloadLink,
    updateRecordingProgress,
    setOriginalRecordedBlob,
    resetOriginalRecordedBlob,
    updateRecordingButtonState,
} from './ui'
import AudioRecorder from './audio'
import { cleanupResources } from '../encoder'

let audioRecorder = null
let recordingType = 'tab'
let recordingStartTime = null
let recordingInterval = null
let totalRecordingTime = 0
let lastUpdateTime = null

export async function toggleRecording(type, originalTab, discard = false) {
    if (!audioRecorder) {
        audioRecorder = new AudioRecorder()
        audioRecorder.onRecordingComplete = handleRecordingComplete
    }

    if (discard) {
        resetOriginalRecordedBlob()
        return discardRecording({ audioRecorder, type })
    }

    if (!audioRecorder.isRecording) {
        resetOriginalRecordedBlob()
        await startRecording({ type, originalTab })
    } else if (audioRecorder.isPaused) {
        resumeRecording()
    } else {
        pauseRecording()
    }

    const { isRecording, isPaused } = audioRecorder
    updateRecordingButtonState({ isRecording, isPaused, type })
}

function updateProgress() {
    const currentTime = Date.now()
    if (lastUpdateTime) {
        totalRecordingTime += currentTime - lastUpdateTime
    }
    lastUpdateTime = currentTime
    updateRecordingProgress(totalRecordingTime / 1000)
}

async function startRecording({ type, originalTab }) {
    try {
        recordingStartTime = Date.now()
        lastUpdateTime = recordingStartTime
        totalRecordingTime = 0
        const settings = await new Promise(resolve =>
            chrome.runtime.sendMessage({ action: 'GET_SETTINGS' }, resolve)
        )
        await audioRecorder.initialize(type, originalTab.id, settings)
        audioRecorder.startRecording()
        recordingType = type

        // Initialize audio player for playback
        audioRecorder.createAudioPlayer()
        recordingInterval = setInterval(updateProgress, 100)
    } catch (error) {
        console.error('Error starting recording:', error)
        resetRecordButton(type)
        resetOriginalRecordedBlob()
        if (recordingInterval) clearInterval(recordingInterval)
    }
}

function pauseRecording() {
    audioRecorder.pauseRecording()
    if (recordingInterval) {
        clearInterval(recordingInterval)
        recordingInterval = null
    }
    updateProgress() // Update one last time before pausing
}

function resumeRecording() {
    audioRecorder.resumeRecording()
    lastUpdateTime = Date.now()
    recordingInterval = setInterval(updateProgress, 100)
}

export function stopRecording() {
    if (!audioRecorder?.isRecording) return

    audioRecorder.stopRecording()
    audioRecorder.closeAudioPlayer()

    if (recordingInterval) {
        clearInterval(recordingInterval)
        recordingInterval = null
    }
    updateProgress() // Update one last time before stopping
    clearProgressUI()
}

function clearProgressUI() {
    const progressUI = document.getElementById('progress-ui')
    if (progressUI) progressUI.remove()
}

export function discardRecording({ audioRecorder, type }) {
    audioRecorder?.discardRecording()
    audioRecorder?.closeAudioPlayer()

    updateRecordingButtonState({ isRecording: false, isPaused: false, type })

    clearProgressUI()

    hideWaveform()
    resetOriginalRecordedBlob()
    cleanupResources()
}

async function handleRecordingComplete(blob) {
    setOriginalRecordedBlob(blob)
    if (audioRecorder.discarding) return

    await updateDownloadLink(blob)
    const audioUrl = URL.createObjectURL(blob)
    updateWavesurfer(audioUrl)
}

export function toggleMute(mute) {
    audioRecorder?.toggleMute(mute)
}
