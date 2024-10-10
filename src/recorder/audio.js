import {
    showRecordingResult,
    showRecordingProgress,
    updateRecordingProgress,
    updateWavesurfer,
} from './ui'

export default class AudioRecorder {
    constructor() {
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

    async initialize(type, tabId, settings) {
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
                audio: this.settings.microphoneId
                    ? { deviceId: { exact: this.settings.microphoneId } }
                    : true,
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
            updateWavesurfer(currentBlob)
        }

        this.mediaRecorder.onstop = () => {
            const audioBlob = new Blob(this.chunks, { type: 'audio/webm' })
            this.onRecordingComplete(audioBlob)
            this.chunks = []
            const audioUrl = URL.createObjectURL(audioBlob)
            showRecordingResult(audioUrl, 'webm')
        }
    }

    startRecording() {
        if (!(this.mediaRecorder && !this.isRecording)) return

        this.mediaRecorder.start(1000)
        this.isRecording = true
        showRecordingProgress()
    }

    stopRecording() {
        if (!(this.mediaRecorder && this.isRecording)) return

        this.mediaRecorder.stop()
        this.isRecording = false
        this.isPaused = false
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

    muteTab() {
        if (this.tabId !== null) {
            chrome.tabs.update(this.tabId, { muted: true })
        }
    }

    unmuteTab() {
        if (this.tabId !== null) {
            chrome.tabs.update(this.tabId, { muted: false }, () => {
                console.log(`Tab ${this.tabId} unmuted`)
            })
        }
    }

    discardRecording() {
        if (this.isRecording) this.stopRecording()

        this.chunks = []
        if (this.stream) this.stream.getTracks().forEach(track => track.stop())

        this.stream = null
        this.mediaRecorder = null
        this.isRecording = false
        this.isPaused = false
    }

    onRecordingComplete(blob) {
        // This method should be overridden by the user of this class
        console.log('Recording complete. Override this method to handle the blob.')
    }

    // Create an audio player to play the captured stream
    async createAudioPlayer() {
        if (!this.stream) return

        this.audioPlayer = new Audio()
        this.audioPlayer.srcObject = this.stream
        await this.audioPlayer.play()
        this.audioPlayer.volume = 0 // Mute the playback
    }

    // Close the audio player
    closeAudioPlayer() {
        if (!this.audioPlayer) return

        this.audioPlayer.pause()
        this.audioPlayer.srcObject = null
        this.audioPlayer = null
    }

    // Handle muting/unmuting the audio output
    toggleMute(mute) {
        if (!this.stream) return

        mute ? this.closeAudioPlayer() : this.createAudioPlayer()
        this.isMuted = mute
    }
}
