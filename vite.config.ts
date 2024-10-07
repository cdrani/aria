import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import manifest from './src/manifest.json'

export default defineConfig({
    root: 'src',
    plugins: [crx({ manifest })],
    server: {
        port: 5173,
        strictPort: true,
        hmr: {
            port: 5173,
        },
    },
})
