// Service Worker for push notifications and offline support

// Cache name for the PWA
const CACHE_NAME = 'rashad-app-v1';

// Files to cache for offline use
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-192x192.png',
  '/pwa-512x512.png'
];

// Socket.io connection status
let socketConnected = false;

// Keep track of clients
let clients = [];

// Queue for storing notifications when socket is disconnected
let notificationQueue = [];

// Function to process queued notifications when socket reconnects
const processNotificationQueue = () => {
  if (notificationQueue.length > 0 && socketConnected) {
    console.log(`Processing ${notificationQueue.length} queued notifications`);
    
    // Process each notification in the queue
    notificationQueue.forEach(notification => {
      self.registration.showNotification(notification.title, notification.options);
    });
    
    // Clear the queue after processing
    notificationQueue = [];
  }
};


self.addEventListener('push', (event) => {
  let data;
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: 'New Notification',
      body: event.data ? event.data.text() : 'No details available'
    };
  }
  
  const options = {
    body: data.body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: data.relatedId ? { relatedId: data.relatedId, type: data.type } : (data.url ? { url: data.url } : {}),
    actions: [
      {
        action: 'view',
        title: 'View Details'
      }
    ]
  };

  // If socket is disconnected, queue the notification for later
  if (!socketConnected && data.requiresSocket) {
    notificationQueue.push({
      title: data.title,
      options: options
    });
    console.log('Notification queued for later delivery');
    return;
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Handle notification click based on action or data
  const action = event.action || 'default';
  const notificationData = event.notification.data || {};
  
  let urlToOpen;
  
  if (notificationData.relatedId && notificationData.type === 'booking_status') {
    // For booking status notifications, navigate to the booking details
    urlToOpen = `/bookings/${notificationData.relatedId}`;
  } else if (notificationData.url) {
    // For notifications with a specific URL
    urlToOpen = notificationData.url;
  } else {
    // Default fallback
    urlToOpen = '/bookings';
  }
  
  // Ensure the URL is absolute
  if (!urlToOpen.startsWith('http')) {
    urlToOpen = new URL(urlToOpen, self.location.origin).href;
  }
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then((windowClients) => {
        // Check if there is already a window/tab open with the target URL
        for (let client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window/tab is open, open a new one
        return self.clients.openWindow(urlToOpen);
      })
  );
});

self.addEventListener('install', (event) => {
  // Cache assets for offline use
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  // Clean up old caches
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    })
    .then(() => clients.claim())
  );
});

// Fetch event - serve from cache if available, otherwise fetch from network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Message event - handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Handle socket connection status updates
  if (event.data && event.data.type === 'SOCKET_STATUS') {
    const previousStatus = socketConnected;
    socketConnected = event.data.connected;
    
    // If socket just reconnected, process any queued notifications
    if (!previousStatus && socketConnected) {
      processNotificationQueue();
    }
  }
  
  // Store client for later communication
  if (event.source) {
    // Keep track of clients to send messages to when in background
    const clientId = event.source.id;
    if (!clients.includes(clientId)) {
      clients.push(clientId);
    }
  }
  
  // Handle notification from the main thread
  if (event.data && event.data.type === 'NOTIFICATION') {
    // If we're in background or the notification requires service worker handling
    if (event.data.options?.data?.forceServiceWorker) {
      // Show the notification using the service worker
      self.registration.showNotification(event.data.title, event.data.options);
    } else {
      // Forward notification to all clients
      self.clients.matchAll().then(allClients => {
        allClients.forEach(client => {
          // Don't send back to the source client
          if (event.source && client.id !== event.source.id) {
            client.postMessage({
              type: 'NOTIFICATION',
              ...event.data
            });
          }
        });
      });
    }
  }
});