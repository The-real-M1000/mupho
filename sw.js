self.addEventListener('install', function(event) {
  console.log('Service Worker instalado');
});

self.addEventListener('fetch', function(event) {
  console.log('Interceptando fetch para', event.request.url);
});
