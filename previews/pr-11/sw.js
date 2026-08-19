const baseUrl = new URL("/tournament-planner/previews/pr-11/", self.location.origin);
const previewRoot = `${baseUrl.pathname}previews/`;
const isPreviewWorker = /\/previews\/pr-\d+\/$/.test(baseUrl.pathname);
const cachePrefix = `tourny-${encodeURIComponent(baseUrl.pathname)}-`;
const cacheName = `${cachePrefix}1.1.0`;
const offlineUrls = [
	baseUrl.pathname,
	`${baseUrl.pathname}index.html`,
	`${baseUrl.pathname}manifest.webmanifest`,
	`${baseUrl.pathname}icon.svg`
];
self.addEventListener("install", (event) => {
	event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(offlineUrls)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
	event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith(cachePrefix) && key !== cacheName).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("message", (event) => {
	if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
self.addEventListener("fetch", (event) => {
	const request = event.request;
	if (request.method !== "GET") return;
	const requestUrl = new URL(request.url);
	if (!isPreviewWorker && requestUrl.origin === self.location.origin && requestUrl.pathname.startsWith(previewRoot)) return;
	if (request.mode === "navigate") {
		event.respondWith(networkFirst(request));
		return;
	}
	if (requestUrl.origin === self.location.origin && requestUrl.pathname.startsWith(baseUrl.pathname)) {
		event.respondWith(cacheFirst(request));
	}
});
async function networkFirst(request) {
	const cache = await caches.open(cacheName);
	try {
		const response = await fetch(request);
		if (response.ok) await cache.put(`${baseUrl.pathname}index.html`, response.clone());
		return response;
	} catch {
		return await cache.match(request) ?? await cache.match(`${baseUrl.pathname}index.html`) ?? Response.error();
	}
}
async function cacheFirst(request) {
	const cache = await caches.open(cacheName);
	const cached = await cache.match(request);
	if (cached) return cached;
	const response = await fetch(request);
	if (response.ok) await cache.put(request, response.clone());
	return response;
}
