import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        watch: {
            ignored: ['!**/./geppetto-meta/geppetto.js/geppetto-client/**'],
            followSymlinks: true
        }
    },
    resolve: {
        alias: {
            '@metacell/geppetto-meta-client': path.resolve(__dirname, './geppetto-meta/geppetto.js/geppetto-client/src')
        }
    }
})
