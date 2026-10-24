import { defineConfig } from '@playwright/test';

// Smoke tests run against the real prerendered build (vite preview), not the
// dev server — the point is exercising hydration of the static output. In CI
// the build step has already run, so only preview is started; locally the
// webServer builds first (slow, but smoke runs are occasional — vitest stays
// the fast loop).
export default defineConfig({
	testDir: 'e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	// CI uploads the HTML report and retry traces as an artifact on failure.
	reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
	use: {
		baseURL: 'http://localhost:4173',
		trace: 'on-first-retry'
	},
	webServer: {
		command: process.env.CI
			? 'pnpm preview --port 4173 --strictPort'
			: 'pnpm build && pnpm preview --port 4173 --strictPort',
		port: 4173,
		reuseExistingServer: !process.env.CI,
		timeout: 180_000
	}
});
