import type { Settings } from '../types';

let encoderWorker: Worker | null = null;

export function initEncoderWorker() {
	encoderWorker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
}

export function encodeAudio(audioData: Float32Array, settings: Settings): Promise<Blob> {
	return new Promise((resolve, reject) => {
		if (!encoderWorker) {
			reject(new Error('Encoder worker not initialized'));
			return;
		}

		encoderWorker.onmessage = (e) => {
			if (e.data.error) {
				reject(new Error(e.data.error));
			} else {
				resolve(e.data.blob);
			}
		};

		encoderWorker.postMessage({
			audioData,
			format: settings.format,
			quality: settings.quality
		});
	});
}

export function cleanupResources() {
	if (encoderWorker) {
		encoderWorker.terminate();
		encoderWorker = null;
	}
}
