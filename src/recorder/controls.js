import {
    hideWaveform,
    updateWavesurfer,
    updateDownloadLink,
    resetRecordButton,
    setOriginalRecordedBlob,
    resetOriginalRecordedBlob,
    updateRecordingButtonState,
} from './ui'
import AudioRecorder from './audio'
import { cleanupResources } from '../encoder'

let audioRecorder = null
let recordingType = 'tab'

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
        audioRecorder.resumeRecording()
    } else {
        audioRecorder.pauseRecording()
    }

    const { isRecording, isPaused } = audioRecorder
    updateRecordingButtonState({ isRecording, isPaused, type })
}

async function startRecording({ type, originalTab }) {
    try {
        const settings = await new Promise(resolve =>
            chrome.runtime.sendMessage({ action: 'GET_SETTINGS' }, resolve)
        )
        await audioRecorder.initialize(type, originalTab.id, settings)
        audioRecorder.startRecording()
        recordingType = type

        // Initialize audio player for playback
        audioRecorder.createAudioPlayer()
    } catch (error) {
        console.error('Error starting recording:', error)
        resetRecordButton(type)
        resetOriginalRecordedBlob()
    }
}

export function stopRecording() {
    if (!audioRecorder?.isRecording) return

    audioRecorder.stopRecording()
    audioRecorder.closeAudioPlayer()
}

export function discardRecording({ audioRecorder, type }) {
    audioRecorder?.discardRecording()
    audioRecorder?.closeAudioPlayer()

    updateRecordingButtonState({ isRecording: false, isPaused: false, type })

    const progressUI = document.getElementById('progress-ui')
    if (progressUI) progressUI.remove()

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
