import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'
import proxyOptions from './proxyOptions';
import tailwindcss from "@tailwindcss/vite"

console.log('Vite config is being loaded!')


// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react(),tailwindcss(),    {
		name: 'test-config',
		configResolved(config) {
		  console.log('Resolved config:', config);
		}
	  }],
	server: {
		port: 8080,
		host: '0.0.0.0',
		proxy: proxyOptions
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src/')
		}
	},
	build: {
		outDir: '../spp/public/sppdash',
		emptyOutDir: true,
		target: 'es2015',
	},
});
