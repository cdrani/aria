export interface Settings {
    muted: boolean
    format: 'webm' | 'mp3' | 'wav'
    quality: number
    microphone: {
        id: null | string
        label: null | string
    }
}

export interface Tab {
    id?: number
    url?: string
    title?: string
}

export interface RecorderState {
    active: boolean
    isRecording: boolean
    isPaused: boolean
    isMuted: boolean
    audioUrl: string | null
}

export type AudioType = 'tab' | 'mic'

export interface Selection {
    value: unknown
    label?: string
}
export type SelectValue = string | number | boolean
