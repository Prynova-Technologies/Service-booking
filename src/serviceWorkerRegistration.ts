import { registerSW } from 'virtual:pwa-register';
import notificationService from './services/notificationService';

// This optional code is used to register a service worker.
// register() is not called by default.

// This lets the app load faster on subsequent visits in production, and gives
// it offline capabilities. However, it also means that developers (and users)
// will only see deployed updates on subsequent visits to a page, after all the
// existing tabs open on the page have been closed, since previously cached
// resources are updated in the background.

export function registerServiceWorker() {
  // Initialize notification service
  notificationService.initialize();
  
  if ('serviceWorker' in navigator) {
    // Register the service worker for background notifications
    // Use a more reliable approach with proper error handling
    const registerAndSubscribe = async () => {
      try {
        // Wait for service worker to be fully registered
        const registration = await navigator.serviceWorker.ready;
        if (!registration.active || registration.active.state !== 'activated') {
          console.log('Waiting for service worker activation');
          await new Promise(resolve => {
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'activated') {
                    resolve();
                  }
                });
              }
            });
          });
        }
        console.log('Service Worker is ready for push notifications');
        
        // Add a small delay to ensure the service worker is fully activated
        if (registration.active && registration.active.state === 'activated') {
          try {
            // Subscribe to push notifications if permission is granted
            const subscription = await notificationService.subscribeToPushNotifications();
            if (subscription) {
              console.log('Successfully subscribed to push notifications');
            }
          } catch (subscribeError) {
            console.error('Failed to subscribe to push notifications:', subscribeError);
          }
        } else {
          console.error('Service worker not activated:', registration.active?.state);
          throw new Error('ServiceWorkerNotActive');
        }
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    };
    
    registerAndSubscribe();
    
    // Listen for messages from the service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'NOTIFICATION') {
        // Handle notification data from service worker
        notificationService.addNotification({
          title: event.data.title,
          message: event.data.message || event.data.body,
          type: event.data.notificationType || event.data.data?.type || 'system',
          relatedId: event.data.relatedId || event.data.data?.relatedId
        });
      }
    });
  }
  }
  
  if (import.meta.env.PROD) {
    // The registerSW function is provided by the vite-plugin-pwa
    const updateSW = registerSW({
      onNeedRefresh() {
        // Show a prompt to the user asking if they want to update
        if (confirm('New content available. Reload to update?')) {
          updateSW(true);
        }
      },
      onOfflineReady() {
        console.log('App ready to work offline');
        notificationService.showNotification('App Ready', {
          body: 'The app is now ready to work offline',
          icon: '/pwa-192x192.png'
        });
      },
    });
  }
