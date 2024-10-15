import type { Settings } from '$lib/types';
import { encodeAudio } from '$lib/encoder';

export default class AudioRecorder {
	private mediaRecorder: MediaRecorder | null = null;
	private audioContext: AudioContext | null = null;
	private sourceNode: MediaStreamAudioSourceNode | null = null;
	private gainNode: GainNode | null = null;
	private destinationNode: MediaStreamAudioDestinationNode | null = null;
	private audioChunks: ArrayBufferLike[] = [];
	public isRecording = false;
	public isPaused = false;
	public isMuted = false;

	async initialize(type: 'tab' | 'microphone', tabId: number, settings: Settings) {
		const stream = await this.getAudioStream(type, tabId, settings);
		this.audioContext = new AudioContext();
		this.sourceNode = this.audioContext.createMediaStreamSource(stream);
		this.gainNode = this.audioContext.createGain();
		this.destinationNode = this.audioContext.createMediaStreamDestination();

		this.sourceNode.connect(this.gainNode);
		this.gainNode.connect(this.destinationNode);

		const options = this.getMediaRecorderOptions(settings);
		this.mediaRecorder = new MediaRecorder(this.destinationNode.stream, options);

		this.mediaRecorder.ondataavailable = (event) => {
			if (event.data.size > 0) {
				this.audioChunks.push(event.data);
			}
		};

		this.mediaRecorder.onstop = () => {
			const audioBlob = new Blob(this.audioChunks, { type: `audio/${settings.format}` });
			this.handleRecordedAudio(audioBlob, settings.format);
		};

		this.setMuted(settings.muted);
	}

	private async getAudioStream(
		type: 'tab' | 'microphone',
		tabId: number,
		settings: Settings
	): Promise<MediaStream> {
		if (type === 'tab') {
			const streamId = await new Promise<string>((resolve) =>
				chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, resolve)
			);
			return await navigator.mediaDevices.getUserMedia({
				audio: {
					mandatory: {
						chromeMediaSource: 'tab',
						chromeMediaSourceId: streamId
					}
				},
				video: false
			} as MediaStreamConstraints);
		} else {
			return await navigator.mediaDevices.getUserMedia({
				audio: { deviceId: settings.microphoneId || undefined }
			});
		}
	}

	private getMediaRecorderOptions(settings: Settings): MediaRecorderOptions {
		const mimeType = `audio/${settings.format}`;
		if (MediaRecorder.isTypeSupported(mimeType)) {
			return { mimeType };
		}
		console.warn(`${mimeType} is not supported, using default`);
		return {};
	}

	startRecording() {
		if (!this.mediaRecorder) return

		this.mediaRecorder.start();
		this.isRecording = true;
		this.isPaused = false;
	}

	pauseRecording() {
		if (this.mediaRecorder && this.isRecording) {
			this.mediaRecorder.pause();
			this.isPaused = true;
		}
	}

	resumeRecording() {
		if (this.mediaRecorder && this.isPaused) {
			this.mediaRecorder.resume();
			this.isPaused = false;
		}
	}

	async stopRecording(settings: Settings) {
		if (!(this.mediaRecorder && this.isRecording)) return;

		this.mediaRecorder.stop();
		this.isRecording = false;
		this.isPaused = false;
		const audioData = this.concatenateAudioChunks();
		const encodedBlob = await encodeAudio(audioData, settings);
		this.handleRecordedAudio(encodedBlob, settings.format);
		this.audioChunks = [];
	}

	setMuted(muted: boolean) {
		if (this.gainNode) {
			this.gainNode.gain.setValueAtTime(muted ? 0 : 1, this.audioContext!.currentTime);
			this.isMuted = muted;
		}
	}

	toggleMute() {
		this.setMuted(!this.isMuted);
	}

	private handleRecordedAudio(audioBlob: Blob, format: string) {
		const url = URL.createObjectURL(audioBlob);
		const a = document.createElement('a');
		a.style.display = 'none';
		a.href = url;
		a.download = `recorded_audio.${format}`;
		document.body.appendChild(a);
		a.click();
		setTimeout(() => {
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
		}, 100);
	}

	cleanup() {
		if (this.mediaRecorder) {
			this.mediaRecorder.stop();
		}
		if (this.audioContext) {
			this.audioContext.close();
		}
		this.sourceNode?.disconnect();
		this.gainNode?.disconnect();
		this.destinationNode?.disconnect();
		this.mediaRecorder = null;
		this.audioContext = null;
		this.sourceNode = null;
		this.gainNode = null;
		this.destinationNode = null;
		this.audioChunks = [];
		this.isRecording = false;
		this.isPaused = false;
		this.isMuted = false;
	}

	private concatenateAudioChunks(): Float32Array {
		const totalLength = this.audioChunks.reduce((acc, chunk) => acc + chunk.length, 0);
		const result = new Float32Array(totalLength);
		let offset = 0;
		for (const chunk of this.audioChunks) {
			const float32Array = new Float32Array(chunk);
			result.set(float32Array, offset);
			offset += float32Array.length;
		}
		return result;
	}
}
