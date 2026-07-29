/// <reference lib="dom" />
/// <reference types="serviceworker" />

type InstallEvent = Event & { waitUntil(promise: Promise<unknown>): void };
type FetchEvent = Event & {
  request: Request;
  respondWith(response: Promise<Response> | Response): void;
};

const CACHE_NAME = "gobaith-shell-v1";
const APP_SHELL_URLS = ["/", "/index.html", "/style.css", "/out.js"];

self.addEventListener("install", async function (event: InstallEvent) {
  console.info("ServiceWorker: Install event:", event);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", async function (event: ExtendableEvent) {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  clients.claim();
  console.info("ServiceWorker: Activate event:", event);
});

self.addEventListener("fetch", async (event: FetchEvent) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  if (request.destination === "document") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match("/index.html").then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return new Response("Offline", { status: 503, statusText: "Offline" });
        }))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      });
    })
  );
});

console.log("ServiceWorker: script evaluated");
