// Kill switch for the old Gatsby site's service worker (gatsby-plugin-offline),
// which returning visitors still have registered at this URL and which would
// keep serving them the cached old site. Browsers re-fetch /sw.js on navigation;
// this replacement clears its caches, unregisters itself, and reloads open
// tabs onto the network. Keep it deployed: some visitors return after years.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			for (const key of await caches.keys()) await caches.delete(key);
			await self.registration.unregister();
			// Only tabs the old worker controlled match. The snapshot pages register
			// /sw.js afresh on every visit, but they're uncontrolled, so no reload loop.
			for (const client of await self.clients.matchAll({ type: 'window' })) {
				client.navigate(client.url);
			}
		})()
	);
});
