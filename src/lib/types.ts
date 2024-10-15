export interface Settings {
	muted: boolean;
	format: 'webm' | 'mp3' | 'wav';
	quality: number;
	microphoneId: string | null;
}

export interface Tab {
	id?: number;
	url?: string;
	title?: string;
}
