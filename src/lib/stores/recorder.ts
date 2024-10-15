import { writable } from 'svelte/store';
import AudioRecorder from '$lib/recorder/audio';
import type { Settings, Tab } from '$lib/types';

function createRecorderStore() {
	const recorder = new AudioRecorder();
	const { subscribe, update } = writable({
		isRecording: false,
		isPaused: false,
		isMuted: false
	});

	return {
		subscribe,
		initialize: async (type: 'tab' | 'microphone', tab: Tab, settings: Settings) => {
			await recorder.initialize(type, tab.id!, settings);
			update((state) => ({ ...state, isMuted: settings.muted }));
		},
		start: () => {
			recorder.startRecording();
			update((state) => ({ ...state, isRecording: true, isPaused: false }));
		},
		pause: () => {
			recorder.pauseRecording();
			update((state) => ({ ...state, isPaused: true }));
		},
		resume: () => {
			recorder.resumeRecording();
			update((state) => ({ ...state, isPaused: false }));
		},
		stop: () => {
			recorder.stopRecording();
			update((state) => ({ ...state, isRecording: false, isPaused: false }));
		},
		toggleMute: () => {
			recorder.toggleMute();
			update((state) => ({ ...state, isMuted: !state.isMuted }));
		},
		cleanup: () => {
			recorder.cleanup();
			update(() => ({ isRecording: false, isPaused: false, isMuted: false }));
		}
	};
}

export const recorderStore = createRecorderStore();
