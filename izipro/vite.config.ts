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
			targets: ['defaults', 'not IE 11', 'safari >= 9'], // Définition des navigateurs cibles
			additionalLegacyPolyfills: ['regenerator-runtime/runtime'], // Polyfills supplémentaires pour Safari 10
			modernPolyfills: true,
		}),
		VitePWA({
			registerType: 'autoUpdate',
			includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
			strategies: 'generateSW',
			srcDir: 'src',
			filename: 'serviceWorker.js',
			manifest: false,
			workbox: {
				globPatterns: ['**/*.{tsx,js,scss,html,png,jpg,svg}'],
				runtimeCaching: [{
					urlPattern: /^https:\/\/back\.betapoptest\.online\/.*/i,
					handler: 'NetworkFirst',
					options: {
						cacheName: 'api-back-cache',
						expiration: {
							maxEntries: 30,
							maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Days
						},
						cacheableResponse: {
							statuses: [0, 200],
						},
					},
				}],
				skipWaiting: true, 
				clientsClaim: true, 
			},
		}),
	],
	build: {
		sourcemap: true,
		/* rollupOptions: {
			external: ['workbox-window']
		  } */
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

