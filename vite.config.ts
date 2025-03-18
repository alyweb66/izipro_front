import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import react from '@vitejs/plugin-react';
// import fs from 'fs';
import path from 'path';
import legacy from '@vitejs/plugin-legacy';

// https://vitejs.dev/config/
export default defineConfig({

	plugins: [
		react(),
		legacy({
			targets: ['defaults', 'not IE 11', 'safari >= 9'], // Target IE11 and Safari 9
			additionalLegacyPolyfills: ['regenerator-runtime/runtime'], // Polyfills for Safari 10
			modernPolyfills: true,
		}),
		VitePWA({
			registerType: 'autoUpdate',
			includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
			strategies: 'injectManifest',
			srcDir: 'src',
			filename: 'serviceWorker.js',
			manifest: false,
			workbox: {
				skipWaiting: true,
				clientsClaim: true,
				cleanupOutdatedCaches: true,
				globPatterns: ['**/*.{tsx,js,scss,html,png,jpg,svg,webp}'],

			},
		}),
	],
	build: {
		sourcemap: false,

	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, 'src'),
		},
	},
	css: {
		preprocessorOptions: {
			scss: {
				api: 'modern-compiler',
			},
		},
	},


	//*HTTPS server
	/* 	server: {
			https: {
			  key: fs.readFileSync(path.resolve(__dirname, 'key.pem')),
			  cert: fs.readFileSync(path.resolve(__dirname, 'cert.pem')),
			},
		  }, */
});

