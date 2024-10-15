import lamejs from 'lamejs';
import { WavEncoder } from './wave-encoder';

self.onmessage = (e) => {
	const { audioData, format, quality } = e.data;

	switch (format) {
		case 'mp3':
			encodeMp3(audioData, quality);
			break;
		case 'wav':
			encodeWav(audioData);
			break;
		default:
			self.postMessage({ error: 'Unsupported format' });
	}
};

export function encodeMp3(audioData: Float32Array, quality: number) {
	const mp3encoder = new lamejs.Mp3Encoder(1, 44_100, quality);
	const mp3Data = [];

	const sampleBlockSize = 1152;
	for (let i = 0; i < audioData.length; i += sampleBlockSize) {
		const sampleChunk = audioData.subarray(i, i + sampleBlockSize);
		const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
		if (mp3buf.length > 0) {
			mp3Data.push(new Int8Array(mp3buf));
		}
	}

	const mp3buf = mp3encoder.flush();
	if (mp3buf.length > 0) {
		mp3Data.push(new Int8Array(mp3buf));
	}

	const blob = new Blob(mp3Data, { type: 'audio/mp3' });
	self.postMessage({ blob });
}

function encodeWav(audioData: Float32Array) {
	const wav = new WavEncoder(audioData, {
		sampleRate: 44_100,
		channels: 1
	});

	const blob = new Blob([wav.getData()], { type: 'audio/wav' });
	self.postMessage({ blob });
}
