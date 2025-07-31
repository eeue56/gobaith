self.addEventListener("install", async function (e) {
  console.info("ServiceWorker: Install event:", e);
  self.skipWaiting();
});

self.addEventListener("activate", async function (e) {
  clients.claim();
  console.info("ServiceWorker: Activate event:", e);
});

self.addEventListener("fetch", async (event) => {
  console.log("ServiceWorker: Fetch event", event);
});

console.log("ServiceWorker: script evaluated");
