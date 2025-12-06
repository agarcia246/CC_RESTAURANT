import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Use VITE_BASE if provided by CI/deployment, otherwise default to '/'
const base = process.env.VITE_BASE || '/';

export default defineConfig({
	base,
	build: {
		outDir: 'dist'
	},
	plugins: [react()]
});
