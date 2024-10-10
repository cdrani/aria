import {
    hideWaveform,
    updateWavesurfer,
    updateDownloadLink,
    resetRecordButton,
    showRecordingProgress,
    updateRecordingButtonState,
} from './ui'
import AudioRecorder from './audio'

let audioRecorder = null
let recordingType = 'tab'

export async function toggleRecording(type, originalTab, discard = false) {
    if (!audioRecorder) {
        audioRecorder = new AudioRecorder()
        audioRecorder.onRecordingComplete = handleRecordingComplete
    }

    if (discard) return discardRecording()

    if (!audioRecorder.isRecording) {
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

        // Initialize audio player for muting
        audioRecorder.createAudioPlayer()
    } catch (error) {
        console.error('Error starting recording:', error)
        resetRecordButton(type)
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
    updateWavesurfer(new Blob([], { type: 'audio/webm' }))
    hideWaveform()
}

function handleRecordingComplete(blob) {
    updateDownloadLink(blob)
    updateWavesurfer(blob)
}

export function toggleMute(mute) {
    audioRecorder?.toggleMute(mute)
}
