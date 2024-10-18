import type { Settings, Tab } from '$lib/types'
import AudioRecorder from './audio'
import { get } from 'svelte/store'
import { settings } from '$lib/stores'

let audioRecorder: AudioRecorder | null = null
let recordingType: 'tab' | 'microphone' = 'tab'
let recordingStartTime: number | null = null
let recordingInterval: number | null = null
let totalRecordingTime = 0
let lastUpdateTime: number | null = null

export async function toggleRecording(type: 'tab' | 'microphone', tab: Tab) {
    if (!audioRecorder) {
        audioRecorder = new AudioRecorder()
    }

    if (!audioRecorder.isRecording) {
        await startRecording({ type, tab })
    } else if (audioRecorder.isPaused) {
        resumeRecording()
    } else {
        pauseRecording()
    }

    return {
        isRecording: audioRecorder.isRecording,
        isPaused: audioRecorder.isPaused,
        type: recordingType
    }
}

async function startRecording({ type, tab }: { type: 'tab' | 'microphone'; tab: Tab }) {
    try {
        recordingStartTime = Date.now()
        lastUpdateTime = recordingStartTime
        totalRecordingTime = 0
        const currentSettings = get(settings)
        await audioRecorder!.initialize(type, tab.id!, currentSettings)
        audioRecorder!.startRecording()
        recordingType = type
        recordingInterval = window.setInterval(updateProgress, 100)
    } catch (error) {
        console.error('Error starting recording:', error)
    }
}

function pauseRecording() {
    audioRecorder!.pauseRecording()
    if (recordingInterval) {
        clearInterval(recordingInterval)
        recordingInterval = null
    }
    updateProgress()
}

function resumeRecording() {
    audioRecorder!.resumeRecording()
    lastUpdateTime = Date.now()
    recordingInterval = window.setInterval(updateProgress, 100)
}

function updateProgress() {
    const currentTime = Date.now()
    if (lastUpdateTime) {
        totalRecordingTime += currentTime - lastUpdateTime
    }
    lastUpdateTime = currentTime
    // Dispatch an event or use a store to update the UI
}

export function stopRecording() {
    if (!audioRecorder?.isRecording) return

    audioRecorder.stopRecording()

    if (recordingInterval) {
        clearInterval(recordingInterval)
        recordingInterval = null
    }
    updateProgress()
    // Clear progress UI or dispatch an event to update the UI
}
