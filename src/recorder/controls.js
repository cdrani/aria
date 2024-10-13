import {
    hideWaveform,
    updateWavesurfer,
    updateDownloadLink,
    resetRecordButton,
    updateRecordingButtonState,
    setOriginalRecordedBlob,
    resetOriginalRecordedBlob,
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
        return discardRecording()
    }

    if (!audioRecorder.isRecording) {
        resetOriginalRecordedBlob() // Reset before starting a new recording
        await startRecording(type, originalTab)
    } else if (audioRecorder.isPaused) {
        audioRecorder.resumeRecording()
    } else {
        audioRecorder.pauseRecording()
    }

    updateRecordingButtonState(audioRecorder.isRecording, audioRecorder.isPaused, type)
}

async function startRecording(type, originalTab) {
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

export function discardRecording() {
    audioRecorder?.discardRecording()
    audioRecorder?.closeAudioPlayer()

    resetRecordButton(recordingType)
    updateRecordingButtonState(false, false, recordingType)

    const recorder = document.querySelector('.recorder')
    recorder.innerHTML = ''
    const audioUrl = URL.createObjectURL(new Blob([], { type: 'audio/webm' }))
    updateWavesurfer(audioUrl)
    hideWaveform()

    resetOriginalRecordedBlob()
    cleanupResources()
}

async function handleRecordingComplete(blob) {
    setOriginalRecordedBlob(blob)
    await updateDownloadLink(blob)
    const audioUrl = URL.createObjectURL(blob)
    updateWavesurfer(audioUrl)
}

export function toggleMute(mute) {
    audioRecorder?.toggleMute(mute)
}
