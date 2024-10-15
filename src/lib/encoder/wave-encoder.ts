class WavEncoder {
	private sampleRate: number;
	private channels: number;
	private samples: Float32Array;

	constructor(audioData: Float32Array, options: { sampleRate: number; channels: number }) {
		this.sampleRate = options.sampleRate;
		this.channels = options.channels;
		this.samples = audioData;
	}

	getData() {
		const buffer = new ArrayBuffer(44 + this.samples.length * 2);
		const view = new DataView(buffer);

		this.writeString(view, 0, 'RIFF');
		view.setUint32(4, 36 + this.samples.length * 2, true);
		this.writeString(view, 8, 'WAVE');
		this.writeString(view, 12, 'fmt ');
		view.setUint32(16, 16, true);
		view.setUint16(20, 1, true);
		view.setUint16(22, this.channels, true);
		view.setUint32(24, this.sampleRate, true);
		view.setUint32(28, this.sampleRate * 4, true);
		view.setUint16(32, 4, true);
		view.setUint16(34, 16, true);
		this.writeString(view, 36, 'data');
		view.setUint32(40, this.samples.length * 2, true);

		this.floatTo16BitPCM(view, 44, this.samples);

		return buffer;
	}

	private writeString(view: DataView, offset: number, string: string) {
		for (let i = 0; i < string.length; i++) {
			view.setUint8(offset + i, string.charCodeAt(i));
		}
	}

	private floatTo16BitPCM(output: DataView, offset: number, input: Float32Array) {
		for (let i = 0; i < input.length; i++, offset += 2) {
			const s = Math.max(-1, Math.min(1, input[i]));
			output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
		}
	}
}
