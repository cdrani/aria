import path from 'path';
import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import type { ManifestV3Export } from '@crxjs/vite-plugin';

import manifest from './manifest.json';

export default defineConfig({
	resolve: {
		alias: {
			$lib: path.resolve(__dirname, '/src/lib')
		}
	},
	plugins: [svelte(), crx({ manifest: manifest as unknown as ManifestV3Export })],
	server: {
		port: 5173,
		strictPort: true,
		hmr: {
			port: 5173
		}
	}
});
