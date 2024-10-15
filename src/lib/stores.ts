import { writable } from 'svelte/store';
import type { Settings, Tab } from './types';

export const settings = writable<Settings>({
	muted: false,
	format: 'webm',
	quality: 128,
	microphoneId: null
});

export const currentTab = writable<Tab | null>(null);
