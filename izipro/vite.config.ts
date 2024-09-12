import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import fs from 'fs';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
	
	plugins: [
		react(),
		visualizer({ open: true })
	],
	build: {
		sourcemap: false, 
		target: 'esnext',
	},
	resolve: {
		alias: {
		  '@': path.resolve(__dirname, 'src'),
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

