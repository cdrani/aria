import { encodeAudio } from '$lib/encoder'
import type { Settings, AudioType } from '$lib/types'

export default class AudioRecorder {
    private type: AudioType = 'tab'
    private mediaRecorder: MediaRecorder | null = null
    private chunks: Blob[] = []
    private stream: MediaStream | null = null
    public isRecording = false
    public isPaused = false
    public isMuted = false
    private audioPlayer: HTMLAudioElement | null = null
    private tabId: number | null = null
    private settings: Settings | null = null
    private discarding: boolean = false
    private onDataAvailable: (audioUrl: string | null) => void = () => {}

    async initialize(type: AudioType, tabId: number, settings: Settings) {
        this.type = type
        this.settings = settings
        if (this.type === 'tab') {
            await this.captureTabAudio(tabId)
        } else if (this.type === 'mic') {
            await this.captureMicrophoneAudio()
        }
    }

    private async captureMicrophoneAudio() {
        try {
            const constraints = {
                audio: this.settings?.microphoneId ? { deviceId: this.settings.microphoneId } : true
            }
            this.stream = await navigator.mediaDevices.getUserMedia(constraints)
            this.setupRecorder()
        } catch (error) {
            console.error('Error capturing microphone audio: ', error)
        }
    }

    private async captureTabAudio(tabId: number) {
        try {
            const streamId = await new Promise<string>((resolve, reject) => {
                chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, (streamId) => {
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
            this.tabId = tabId
            await this.createAudioPlayer()
        } catch (error) {
            console.error('Error capturing tab audio: ', error)
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
            if (!this.discarding) {
                this.onRecordingComplete()
            }
            this.discarding = false
        }
    }

    startRecording() {
        if (!(this.mediaRecorder && !this.isRecording)) return

        this.mediaRecorder.start(250)
        this.isRecording = true
    }

    stopRecording(discarding: boolean = false) {
        if (!(this.mediaRecorder && this.isRecording)) return

        this.discarding = discarding
        this.mediaRecorder.stop()
        this.isRecording = false
        this.isPaused = false
        this.releaseStream()
    }

    pauseRecording() {
        if (!(this.mediaRecorder && this.isRecording && !this.isPaused)) return

        this.mediaRecorder.pause()
        this.isPaused = true
    }

    resumeRecording() {
        if (!(this.mediaRecorder && this.isRecording && this.isPaused)) return

        this.mediaRecorder.resume()
        this.isPaused = false
    }

    toggleMute() {
        if (!this.stream) return

        this.isMuted = !this.isMuted
        this.stream.getAudioTracks().forEach((track) => (track.enabled = !this.isMuted))

        if (this.audioPlayer) {
            this.audioPlayer.muted = this.isMuted
        }
    }

    discardRecording() {
        if (this.isRecording) this.stopRecording(true)
        this.chunks = []
        this.mediaRecorder = null
        this.onDataAvailable(null) // Explicitly call onDataAvailable with null
    }

    private onRecordingComplete() {
        this.releaseStream()
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
