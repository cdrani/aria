import {
    updateWavesurfer,
    showRecordingResult,
    showRecordingProgress,
    updateRecordingProgress,
} from './ui'

export default class AudioRecorder {
    constructor() {
        this.type = null
        this.mediaRecorder = null
        this.chunks = []
        this.stream = null
        this.isRecording = false
        this.isPaused = false
        this.isMuted = false
        this.audioPlayer = null
        this.tabId = null
        this.settings = null
    }

    async getSettings() {
        const settings = await new Promise(resolve =>
            chrome.runtime.sendMessage({ action: 'GET_SETTINGS' }, resolve)
        )
        this.settings = settings
    }

    async initialize(type, tabId, settings) {
        this.type = type
        this.settings = settings
        if (type === 'tab') {
            await this.captureTabAudio(tabId)
        } else if (type === 'microphone') {
            await this.captureMicrophoneAudio()
        }
    }

    async captureMicrophoneAudio() {
        try {
            const constraints = {
                audio: this.settings.microphoneId ? { deviceId: this.settings.microphoneId } : true,
            }
            this.stream = await navigator.mediaDevices.getUserMedia(constraints)
            this.setupRecorder()
        } catch (error) {
            console.error('Error capturing microphone audio: ', error)
        }
    }

    async captureTabAudio(tabId) {
        try {
            const streamId = await new Promise((resolve, reject) => {
                chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, streamId => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError)
                    } else {
                        resolve(streamId)
                    }
                })
            })

            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: streamId } },
            })

            this.setupRecorder()
            this.tabId = tabId
        } catch (error) {
            console.error('Error capturing tab audio: ', error)
        }
    }

    setupRecorder() {
        if (!this.stream) return

        const options = { mimeType: 'audio/webm', audioBitsPerSecond: this.settings.quality * 1000 }
        this.mediaRecorder = new MediaRecorder(this.stream, options)

        this.mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0) this.chunks.push(event.data)
            updateRecordingProgress(this.chunks.length)

            const currentBlob = new Blob(this.chunks, { type: 'audio/webm' })
            const audioUrl = URL.createObjectURL(currentBlob)
            updateWavesurfer(audioUrl)
        }

        this.mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(this.chunks, { type: 'audio/webm' })
            this.onRecordingComplete(audioBlob)
            if (!this.discarding) {
                const audioUrl = URL.createObjectURL(audioBlob)
                showRecordingResult(audioUrl, 'webm')
            }
            this.chunks = []
            this.discarding = false
        }
    }

    startRecording() {
        if (!(this.mediaRecorder && !this.isRecording)) return

        this.mediaRecorder.start(250)
        this.isRecording = true
        showRecordingProgress()
    }

    stopRecording(discard = false) {
        if (!(this.mediaRecorder && this.isRecording)) return

        this.discarding = discard
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

    muteRecording() {
        if (!(this.stream && !this.isMuted)) return

        this.stream.getAudioTracks().forEach(track => (track.enabled = false))
        this.isMuted = true
    }

    unmuteRecording() {
        if (!(this.stream && this.isMuted)) return

        this.stream.getAudioTracks().forEach(track => (track.enabled = true))
        this.isMuted = false
    }

    discardRecording() {
        if (this.isRecording) this.stopRecording(true)

        this.chunks = []
        this.releaseStream()

        this.mediaRecorder = null
        this.isRecording = false
        this.isPaused = false
    }

    // TODO:  maybe load download link here?
    onRecordingComplete(_blob) {
        this.releaseStream()
    }

    async createAudioPlayer() {
        if (!this.stream) return

        this.audioPlayer = new Audio()
        this.audioPlayer.srcObject = this.stream
        await this.audioPlayer.play()
    }

    closeAudioPlayer() {
        if (!this.audioPlayer) return

        this.audioPlayer.pause()
        this.audioPlayer.srcObject = null
        this.audioPlayer = null
    }

    toggleMute(mute) {
        if (!this.stream) return

        mute ? this.closeAudioPlayer() : this.createAudioPlayer()
        this.isMuted = mute
    }

    releaseStream() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop())
            this.stream = null
        }
        if (this.tabId) {
            chrome.tabCapture.getCapturedTabs(tabs => {
                if (tabs.some(tab => tab.tabId === this.tabId)) {
                    chrome.tabCapture.stopCapture(this.tabId, () => {
                        if (chrome.runtime.lastError) {
                            console.error('Error stopping tab capture:', chrome.runtime.lastError)
                        }
                    })
                }
            })
        }
        this.tabId = null
    }
}
