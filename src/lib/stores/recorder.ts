import { get, writable } from 'svelte/store'

import { encodeAudio } from '$lib/encoder'
import AudioRecorder from '$lib/recorder/audio'
import { audioType, settings } from '$lib/stores'
import type { Settings, RecorderState, AudioType } from '$lib/types'

const initialState: RecorderState = {
    audioUrl: null,
    active: false,
    isMuted: false,
    isPaused: false,
    isRecording: false
}

function createRecorderStore() {
    const recorder = new AudioRecorder()
    const { subscribe, update } = writable<RecorderState>(initialState)

    recorder.setOnDataAvailable((audioUrl: string | null) => {
        update((state) => ({ ...state, audioUrl }))
    })

    return {
        subscribe,
        initialize: async () => {
            const type = get(audioType) as AudioType
            const currentSettings = get(settings) as Settings
            await recorder.initialize(type, currentSettings)
            update((state) => ({ ...state, isMuted: currentSettings.muted }))
        },
        start: () => {
            recorder.cleanup()
            recorder.startRecording()
            update((state) => ({
                ...state,
                active: true,
                isRecording: true,
                isPaused: false,
                audioUrl: null
            }))
        },
        pause: () => {
            recorder.pauseRecording()
            update((state) => ({ ...state, isPaused: true }))
        },
        resume: () => {
            recorder.resumeRecording()
            update((state) => ({ ...state, isPaused: false }))
        },
        stop: () => {
            recorder.stopRecording()
            update((state) => ({ ...state, isRecording: false, isPaused: false }))
        },
        discard: () => {
            recorder.discardRecording()
            update(() => initialState)
        },
        toggleMute: () => {
            recorder.toggleMute()
            update((state) => ({ ...state, isMuted: !state.isMuted }))
        },
        cleanup: () => {
            recorder.cleanup()
            update(() => initialState)
        },
        download: async (fileName: string) => {
            try {
                const audioBlob = await recorder.prepareForDownload()
                const currentSettings = get(settings) as Settings
                const encodedBlob: Blob =
                    currentSettings.format == 'webm'
                        ? audioBlob
                        : await encodeAudio(audioBlob, currentSettings)

                const url = URL.createObjectURL(encodedBlob)
                const a = document.createElement('a')
                a.style.display = 'none'
                a.href = url
                a.download = fileName
                document.body.appendChild(a)
                a.click()
                setTimeout(() => {
                    document.body.removeChild(a)
                    window.URL.revokeObjectURL(url)
                }, 1000)
            } catch (error) {
                console.error('Error in download process:', error)
            }
        }
    }
}

export const recorderStore = createRecorderStore()
