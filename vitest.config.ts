import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		tsconfigPaths: true
	},
	test: {
		testTimeout: 30000,
		clearMocks: true,
		exclude: ['**/node_modules/**', '**/firebase.emulator.data/**', 'dist/**/*']
	}
});
