// Service worker minimal — réservé pour les évolutions futures
// (ex: écoute des messages de la page active pour scellement in-page).
self.addEventListener("install", () => {
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
