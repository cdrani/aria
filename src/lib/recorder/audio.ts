import { encodeAudio } from '$lib/encoder'
import type { Settings, AudioType } from '$lib/types'

export default class AudioRecorder {
    private type: AudioType
    private mediaRecorder: MediaRecorder | null = null
    private chunks: Blob[] = []
    private stream: MediaStream | null = null
    public isMuted = false
    private audioPlayer: HTMLAudioElement | null = null
    private tabId: number | null = null
    private settings: Settings | null = null
    private onDataAvailable: (audioUrl: string | null) => void = () => {}

    async initialize(type: AudioType, settings: Settings) {
        this.type = type
        this.settings = settings
        if (this.type === 'tab') {
            await this.captureTabAudio()
        } else if (this.type === 'mic') {
            await this.captureMicrophoneAudio()
        }
    }

    get isRecording() {
        return this.mediaRecorder
            ? this.mediaRecorder.state === 'recording' || this.isPaused
            : false
    }

    get isPaused() {
        return this.mediaRecorder ? this.mediaRecorder.state === 'paused' : false
    }

    private async captureMicrophoneAudio() {
        try {
            const constraints = {
                audio: this.settings?.microphone?.id
                    ? { deviceId: this.settings.microphone.id }
                    : true
            }
            this.stream = await navigator.mediaDevices.getUserMedia(constraints)
            this.setupRecorder()
        } catch (error) {
            console.error('Error capturing microphone audio: ', error)
        }
    }

    private async getCurrentTab() {
        const tab = await chrome.runtime.sendMessage({ action: 'GET_CURRENT_TAB' })
        if (!tab) throw new Error('No current active tab')
        return tab
    }

    private async captureTabAudio() {
        try {
            const tab = await this.getCurrentTab()

            const streamId = await new Promise<string>((resolve, reject) => {
                chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id }, (streamId) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError)
                    } else {
                        resolve(streamId)
                    }
                })
            })

            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: streamId }
                } as MediaTrackConstraints
            })

            this.setupRecorder()
            this.tabId = tab.id
            await this.createAudioPlayer()
        } catch (error) {
            console.error('Error capturing tab audio: ', error?.message)
        }
    }

    private setupRecorder() {
        if (!this.stream) return

        const options = {
            mimeType: 'audio/webm',
            audioBitsPerSecond: this.settings!.quality * 1000
        }
        this.mediaRecorder = new MediaRecorder(this.stream, options)

        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size <= 0) return

            this.chunks.push(event.data)
            const currentBlob = new Blob(this.chunks, { type: 'audio/webm' })
            const audioUrl = URL.createObjectURL(currentBlob)
            this.onDataAvailable(audioUrl)
        }

        this.mediaRecorder.onstop = () => {
            this.chunks = []
            this.mediaRecorder = null
            this.releaseStream()
        }
    }

    startRecording() {
        if (!(this.mediaRecorder && !this.isRecording)) return

        this.mediaRecorder.start(1000)
    }

    stopRecording() {
        if (!(this.mediaRecorder && this.isRecording)) return

        this.mediaRecorder?.stop()
    }

    pauseRecording() {
        if (this.isPaused) return

        this.mediaRecorder?.pause()
    }

    resumeRecording() {
        if (!this.isPaused) return

        this.mediaRecorder?.resume()
    }

    toggleMute() {
        if (!this.stream) return

        this.isMuted = !this.isMuted
        this.stream.getAudioTracks().forEach((track) => (track.enabled = !this.isMuted))

        if (this.audioPlayer) this.audioPlayer.muted = this.isMuted
    }

    discardRecording() {
        if (this.isRecording) this.stopRecording()
        this.onDataAvailable(null)
    }

    private async createAudioPlayer() {
        if (!this.stream) return

        this.audioPlayer = new Audio()
        this.audioPlayer.srcObject = this.stream
        this.audioPlayer.muted = this.isMuted
        await this.audioPlayer.play()
    }

    private closeAudioPlayer() {
        if (!this.audioPlayer) return

        this.audioPlayer.pause()
        this.audioPlayer.srcObject = null
        this.audioPlayer = null
    }

    private releaseStream() {
        this.closeAudioPlayer()

        if (this.stream) {
            this.stream.getTracks().forEach((track) => track.stop())
            this.stream = null
        }
        if (this.tabId) {
            chrome.tabCapture.getCapturedTabs((tabs) => {
                if (tabs.some((tab) => tab.tabId === this.tabId)) {
                    chrome.tabCapture.stopCapture(this.tabId!, () => {
                        if (chrome.runtime.lastError) {
                            console.error('Error stopping tab capture:', chrome.runtime.lastError)
                        }
                    })
                }
            })
        }
        this.tabId = null
    }

    cleanup() {
        if (this.stream) this.discardRecording()
        this.type = 'tab'
        this.settings = null
    }

    getRecordedBlob(): Blob | null {
        if (this.chunks.length === 0) return null
        return new Blob(this.chunks, { type: 'audio/webm' })
    }

    setOnDataAvailable(callback: (audioUrl: string | null) => void) {
        this.onDataAvailable = callback
    }

    async downloadRecording() {
        if (this.chunks.length === 0) {
            console.error('No recording available to download')
            return
        }

        const blob = new Blob(this.chunks, { type: 'audio/webm' })
        const arrayBuffer = await blob.arrayBuffer()
        const audioData = new Float32Array(arrayBuffer)

        try {
            const encodedBlob = await encodeAudio(audioData, this.settings!)
            const url = URL.createObjectURL(encodedBlob)
            const a = document.createElement('a')
            a.style.display = 'none'
            a.href = url
            a.download = `recording.${this.settings!.format}`
            document.body.appendChild(a)
            a.click()
            setTimeout(() => {
                document.body.removeChild(a)
                window.URL.revokeObjectURL(url)
            }, 100)
        } catch (error) {
            console.error('Error encoding audio:', error)
        }
    }

    async prepareForDownload(): Promise<Blob> {
        if (this.chunks.length === 0) {
            throw new Error('No recording available to download')
        }

        return new Blob(this.chunks, { type: 'audio/webm' })
    }
}
