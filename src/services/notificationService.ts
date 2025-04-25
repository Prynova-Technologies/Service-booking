import { registerSW } from 'virtual:pwa-register';
import { getApiUrl } from '../config/env';

interface PushSubscription {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: 'booking_status' | 'system' | 'other';
  relatedId?: string; // For linking to related content (e.g., booking ID)
}

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

class NotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private notifications: Notification[] = [];
  private listeners: ((notification: Notification) => void)[] = [];

  async initialize(): Promise<void> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications are not supported in this browser');
      return;
    }

    try {
      // Check if service worker is already registered
      const existingRegistration = await navigator.serviceWorker.getRegistration('/sw.js');
      
      if (existingRegistration) {
        console.log('Using existing Service Worker registration', existingRegistration);
        this.swRegistration = existingRegistration;
      } else {
        // Register the service worker if not already registered
        this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        console.log('Service Worker registered successfully', this.swRegistration);
      }

      // Wait for the service worker to be activated
      if (this.swRegistration.installing || this.swRegistration.waiting) {
        console.log('Service Worker is installing/waiting - waiting for activation');
        
        // Wait for the service worker to become active
        await new Promise<void>((resolve) => {
          const serviceWorker = this.swRegistration!.installing || this.swRegistration!.waiting;
          if (!serviceWorker) {
            resolve();
            return;
          }
          
          serviceWorker.addEventListener('statechange', (e) => {
            if (serviceWorker.state === 'activated') {
              console.log('Service Worker activated successfully');
              resolve();
            }
          });
        });
      } else {
        console.log('Service Worker is already active');
      }

      // Check if we already have permission
      await this.checkNotificationPermission();
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  async checkNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    // Check if push notifications are supported
    if (!('PushManager' in window)) {
      console.error('Push notifications are not supported in this browser');
      return null;
    }

    // Check if we're in a secure context (required for push notifications)
    if (window.isSecureContext === false) {
      console.error('Push notifications require a secure context (HTTPS)');
      return null;
    }

    if (!this.swRegistration) {
      try {
        // Wait for service worker to be fully registered
        console.log('Waiting for service worker to be ready...');
        this.swRegistration = await navigator.serviceWorker.ready;
        console.log('Service Worker is ready', this.swRegistration);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        throw new Error('ServiceWorkerRegistrationFailed');
      }
    }

    const hasPermission = await this.checkNotificationPermission();
    if (!hasPermission) {
      console.log('Push notification permission not granted');
      return null;
    }

    if (!this.swRegistration) {
      console.error('Service worker registration not available');
      return null;
    }

    try {
      // Get the subscription if it exists
      let subscription = await this.swRegistration.pushManager.getSubscription();

      // If subscription exists, return it
      if (subscription) {
        console.log('Using existing push subscription');
        console.log(`Subscription endpoint: ${subscription.endpoint.substring(0, 30)}...`);
        return subscription as unknown as PushSubscription;
      }
      
      // Check if VAPID key is available
      if (!VAPID_PUBLIC_KEY) {
        console.error('VAPID public key is not available');
        return null;
      }

      console.log(`VAPID key found. Length: ${VAPID_PUBLIC_KEY.length}`);

      // Validate VAPID key format before conversion
      if (!/^[A-Za-z0-9_-]+$/.test(VAPID_PUBLIC_KEY)) {
        console.error('Invalid VAPID key format - contains invalid characters');
        throw new Error('VAPID_PUBLIC_KEY must be a valid base64-encoded string');
      }

      if (VAPID_PUBLIC_KEY.length < 20) {
        console.error('VAPID key is too short to be valid');
        throw new Error('VAPID_PUBLIC_KEY is too short to be valid');
      }
      
      // Convert the public key to the format expected by the browser
      try {
        const convertedVapidKey = this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        console.log('VAPID key conversion successful. Key length:', convertedVapidKey.length);
        
        // Implement retry mechanism for push subscription
        return await this.trySubscribeWithRetry(convertedVapidKey, 3);
      } catch (vapidError) {
        console.error('Failed to process VAPID key:', vapidError);
        throw new Error(`VAPID key processing failed: ${vapidError instanceof Error ? vapidError.message : 'unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  // Helper method to attempt subscription with retries
  private async trySubscribeWithRetry(applicationServerKey: Uint8Array, maxRetries: number): Promise<PushSubscription | null> {
    let lastError: Error | null = null;
    let retryCount = 0;
    
    // First, try to clean up any existing problematic subscriptions
    try {
      if (this.swRegistration) {
        const existingSubscription = await this.swRegistration.pushManager.getSubscription();
        if (existingSubscription) {
          console.log('Found existing subscription, unsubscribing first to avoid conflicts');
          await existingSubscription.unsubscribe();
          console.log('Successfully unsubscribed from existing subscription');
        }
      }
    } catch (cleanupError) {
      console.warn('Error cleaning up existing subscription:', cleanupError);
      // Continue with subscription attempts even if cleanup fails
    }
    
    // Verify the service worker is in the correct state before attempting subscription
    if (this.swRegistration && (!this.swRegistration.active || this.swRegistration.active.state !== 'activated')) {
      console.warn(`Service worker is not in activated state: ${this.swRegistration.active?.state || 'no active worker'}`);
      console.log('Waiting for service worker to be fully activated before subscription attempts...');
      
      try {
        // Wait for service worker to be fully activated
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Timed out waiting for service worker activation'));
          }, 10000);
          
          if (!this.swRegistration || !this.swRegistration.installing && !this.swRegistration.waiting) {
            clearTimeout(timeout);
            resolve(); // No installing or waiting worker, so we're good to proceed
            return;
          }
          
          const worker = this.swRegistration.installing || this.swRegistration.waiting;
          if (worker) {
            worker.addEventListener('statechange', () => {
              if (worker.state === 'activated') {
                clearTimeout(timeout);
                console.log('Service worker activated successfully');
                resolve();
              }
            });
          } else {
            clearTimeout(timeout);
            resolve();
          }
        });
      } catch (activationError) {
        console.error('Failed to wait for service worker activation:', activationError);
        // Continue anyway, but log the error
      }
    }
    
    while (retryCount < maxRetries) {
      try {
        console.log(`Attempting push subscription (attempt ${retryCount + 1} of ${maxRetries})`);
        
        // Add a small delay between retries (increasing with each retry)
        if (retryCount > 0) {
          const delay = Math.min(30000, 1000 * Math.pow(2, retryCount));
          console.log(`Retrying in ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Cleanup existing subscriptions before retry
          try {
            const existingSub = await this.swRegistration?.pushManager.getSubscription();
            if (existingSub) {
              await existingSub.unsubscribe();
              console.log('Cleaned up existing subscription before retry');
            }
          } catch (cleanupError) {
            console.warn('Failed to cleanup before retry:', cleanupError);
            // Continue anyway
          }
        }
        
        // Verify we have a valid service worker registration before proceeding
        if (!this.swRegistration || !this.swRegistration.active) {
          console.warn('Service worker not active before subscription attempt, trying to get ready service worker');
          try {
            this.swRegistration = await navigator.serviceWorker.ready;
            console.log('Retrieved ready service worker registration');
          } catch (swError) {
            console.error('Failed to get ready service worker:', swError);
            throw new Error('Service worker not available');
          }
        }
        
        // Create subscription with timeout
        const subscription = await this.createSubscriptionWithTimeout(applicationServerKey);
        
        // If we got here, subscription was successful
        console.log('Push subscription successful on attempt', retryCount + 1);
        
        // Send the subscription to the backend
        try {
          const response = await fetch(getApiUrl('/api/notifications/subscribe'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              endpoint: subscription.endpoint,
              keys: {
                p256dh: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(subscription.getKey('p256dh') || new ArrayBuffer(0))))),
                auth: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(subscription.getKey('auth') || new ArrayBuffer(0)))))
              },
              expirationTime: subscription.expirationTime
            })
          });

          if (!response.ok) {
            console.warn(`Backend subscription save failed: ${response.status}`);
            // Continue with client-side subscription even if backend save fails
          } else {
            console.log('Subscription saved to backend successfully');
          }
        } catch (error) {
          console.warn('Failed to save subscription to backend:', error);
          // Continue with client-side subscription even if backend save fails
        }
        
        return subscription as unknown as PushSubscription;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Subscription attempt ${retryCount + 1} failed:`, error);
        
        // Check if this is a permission or network error that won't be resolved by retrying
        if (error instanceof Error) {
          const errorMessage = error.message.toLowerCase();
          const errorName = error.name;
          
          // Handle specific error types
          if (errorName === 'AbortError' && errorMessage.includes('push service')) {
            console.log('Detected AbortError with push service - will retry with longer delay');
            // Add a longer delay for push service errors
            await new Promise(resolve => setTimeout(resolve, 3000));
            retryCount++;
            continue;
          } else if (errorName === 'NotAllowedError') {
            console.error('Permission denied for push notification - will not retry');
            break; // Exit retry loop for permission errors
          } else if (errorName === 'InvalidStateError') {
            console.warn('Invalid state error - service worker may not be properly activated');
            // Try to get a fresh service worker registration
            try {
              this.swRegistration = await navigator.serviceWorker.ready;
              console.log('Retrieved fresh service worker registration after InvalidStateError');
              retryCount++;
              continue;
            } catch (swError) {
              console.error('Failed to get fresh service worker:', swError);
              break;
            }
          } else if (errorName === 'NetworkError' || errorMessage.includes('network')) {
            console.warn('Network error detected - will retry');
            // Add a delay for network errors
            await new Promise(resolve => setTimeout(resolve, 2000));
            retryCount++;
            continue;
          } else if (errorMessage.includes('permission') || 
              errorMessage.includes('denied') ||
              errorMessage.includes('not supported')) {
            console.error('Fatal push subscription error - will not retry:', error);
            break; // Exit retry loop for fatal errors
          }
        }
        
        retryCount++;
      }
    }
    
    // If we got here, all retries failed
    console.error(`All subscription attempts failed after ${maxRetries} retries`);
    throw new Error(`PushSubscriptionFailed: ${lastError?.message || 'Unknown error'}`);
  }
  
  // Helper method to create subscription with timeout
  private async createSubscriptionWithTimeout(applicationServerKey: Uint8Array): Promise<PushSubscription> {
    if (!this.swRegistration) {
      console.error('Service worker registration not available');
      throw new Error('Service worker registration not available');
    }
    
    // Validate the applicationServerKey
    if (!applicationServerKey || applicationServerKey.length === 0) {
      console.error('Invalid application server key - empty or zero length');
      throw new Error('Invalid application server key');
    }
    
    console.log(`Application server key validation passed. Length: ${applicationServerKey.length}`);
    console.log(`Service worker state: ${this.swRegistration.active?.state || 'not active'}`);
    
    // Ensure service worker is fully activated
    if (this.swRegistration.installing || this.swRegistration.waiting) {
      console.log('Waiting for service worker to activate before subscribing...');
      try {
        await new Promise<void>((resolve, reject) => {
          const serviceWorker = this.swRegistration!.installing || this.swRegistration!.waiting;
          if (!serviceWorker) {
            resolve();
            return;
          }
          
          // Set a timeout for activation
          const activationTimeoutId = setTimeout(() => {
            reject(new Error('Service worker activation timed out'));
          }, 10000);
          
          serviceWorker.addEventListener('statechange', () => {
            if (serviceWorker.state === 'activated') {
              clearTimeout(activationTimeoutId);
              console.log('Service worker activated, proceeding with subscription');
              resolve();
            } else if (serviceWorker.state === 'redundant') {
              clearTimeout(activationTimeoutId);
              reject(new Error('Service worker became redundant during activation'));
            }
          });
        });
      } catch (activationError) {
        console.error('Service worker activation failed:', activationError);
        throw activationError;
      }
    }
    
    return new Promise<PushSubscription>((resolve, reject) => {
      // Set a longer timeout (20 seconds) to account for slow networks
      const timeoutId = setTimeout(() => {
        const err = new Error(`Push subscription timed out. SW state: ${this.swRegistration?.active?.state}, VAPID length: ${applicationServerKey?.length}`);
        console.error('Subscription timeout:', err.message);
        reject(err);
      }, 20000);
      
      // Log the subscription attempt
      console.log('Attempting to subscribe to push service with application server key');
      console.log(`Push Manager available: ${!!this.swRegistration.pushManager}`);
      
      // Check if browser supports PushManager
      if (!this.swRegistration.pushManager) {
        clearTimeout(timeoutId);
        const noPushManagerError = new Error('PushManager not supported in this browser');
        console.error(noPushManagerError.message);
        reject(noPushManagerError);
        return;
      }
      
      this.swRegistration!.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      })
      .then(subscription => {
        clearTimeout(timeoutId);
        console.log('New subscription created successfully');
        console.log(`Subscription endpoint: ${subscription.endpoint.substring(0, 30)}...`);
        console.log(`Subscription has auth key: ${!!subscription.getKey('auth')}`);
        console.log(`Subscription has p256dh key: ${!!subscription.getKey('p256dh')}`);
        resolve(subscription);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        
        // Enhanced error logging for debugging
        if (error.name === 'AbortError') {
          console.error('AbortError during push subscription. This may be due to:');
          console.error('- Network connectivity issues');
          console.error('- Push service unavailability');
          console.error('- Invalid VAPID key format');
          console.error('Detailed error:', error);
          
          // Check if we're in a secure context
          if (window.isSecureContext === false) {
            console.error('Push notifications require a secure context (HTTPS)');
          }
        } else if (error.name === 'NotAllowedError') {
          console.error('Push subscription not allowed. Permission may have been denied.');
        } else if (error.name === 'InvalidStateError') {
          console.error('Push subscription failed due to invalid state. Service worker may not be properly activated.');
        } else {
          console.error('Error creating push subscription:', error);
        }
        
        reject(error);
      });
    });
  }

  async unsubscribeFromPushNotifications(): Promise<boolean> {
    if (!this.swRegistration) {
      return false;
    }

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      
      if (subscription) {
        // Notify backend about unsubscription
        try {
          const response = await fetch(getApiUrl('/api/notifications/unsubscribe'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              endpoint: subscription.endpoint
            })
          });

          if (!response.ok) {
            throw new Error(`Failed to unsubscribe on server: ${response.status}`);
          }

          // Only unsubscribe locally if server unsubscription was successful
          await subscription.unsubscribe();
          console.log('Successfully unsubscribed from push notifications');
          return true;
        } catch (error) {
          console.error('Failed to unsubscribe on server:', error);
          return false;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }

  // Helper function to display a notification
  async showNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    const hasPermission = await this.checkNotificationPermission();
    
    if (hasPermission) {
      if (this.swRegistration) {
        // Check if we should use the service worker or send via socket
        if (document.visibilityState === 'hidden' || options.data?.forceServiceWorker) {
          // Use service worker for notifications to ensure they work in background
          await this.swRegistration.showNotification(title, {
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            vibrate: [200, 100, 200],
            requireInteraction: true, // Keep notification visible until user interacts with it
            ...options
          });
        } else {
          // If the app is visible, send the notification to the service worker
          // This allows the service worker to track it and handle it consistently
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'NOTIFICATION',
              title,
              options
            });
          } else {
            // Fallback to regular notifications if service worker is not available
            new Notification(title, {
              icon: '/pwa-192x192.png',
              badge: '/pwa-192x192.png',
              ...options
            });
          }
        }
      } else {
        // Fallback to regular notifications if service worker is not available
        new Notification(title, {
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          ...options
        });
      }
    }
  }

  // Add a notification to the internal store and trigger listeners
  addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): Notification {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: Date.now(),
      read: false
    };

    this.notifications = [newNotification, ...this.notifications];
    
    // Save to localStorage
    this.saveNotifications();
    
    // Notify listeners
    this.notifyListeners(newNotification);
    
    // Show the notification
    this.showNotification(newNotification.title, {
      body: newNotification.message,
      data: { notificationId: newNotification.id, type: newNotification.type, relatedId: newNotification.relatedId }
    });
    
    return newNotification;
  }

  // Add a listener for new notifications
  addListener(callback: (notification: Notification) => void): void {
    this.listeners.push(callback);
  }

  // Remove a listener
  removeListener(callback: (notification: Notification) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notify all listeners of a new notification
  private notifyListeners(notification: Notification): void {
    this.listeners.forEach(listener => listener(notification));
  }

  // Get all notifications
  getNotifications(): Notification[] {
    return this.notifications;
  }

  // Mark a notification as read
  markAsRead(id: string): void {
    this.notifications = this.notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    );
    this.saveNotifications();
  }

  // Save notifications to localStorage
  private saveNotifications(): void {
    localStorage.setItem('notifications', JSON.stringify(this.notifications));
  }

  // Load notifications from localStorage
  loadNotifications(): void {
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      this.notifications = JSON.parse(savedNotifications);
    }
  }

  // Create a notification for booking status change
  notifyBookingStatusChange(bookingId: string, serviceName: string, newStatus: string): Notification {
    return this.addNotification({
      title: `Booking Status Updated`,
      message: `Your booking for ${serviceName} is now ${newStatus}`,
      type: 'booking_status',
      relatedId: bookingId
    });
  }
  
  // Send a notification to the service worker
  sendNotificationToServiceWorker(notification: Notification): void {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'NOTIFICATION',
        title: notification.title,
        body: notification.message,
        data: {
          notificationId: notification.id,
          type: notification.type,
          relatedId: notification.relatedId,
          requiresSocket: true
        }
      });
    }
  }

  // Utility function to convert base64 to Uint8Array
  // This is needed for the applicationServerKey
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    if (!base64String) {
      console.error('VAPID key is empty or undefined');
      throw new Error('Invalid VAPID key: empty or undefined');
    }
    
    // Log the VAPID key for debugging (without revealing the full key)
    console.log(`Processing VAPID key (first 10 chars): ${base64String.substring(0, 10)}...`);
    console.log(`VAPID key length: ${base64String.length}`);
    
    // Validate the base64 string format with a more permissive regex
    // Web Push VAPID keys should be URL-safe base64 encoded
    if (!/^[A-Za-z0-9_-]+$/.test(base64String)) {
      console.error('VAPID key contains invalid characters');
      throw new Error('Invalid VAPID key format: contains invalid characters');
    }
    
    try {
      // Calculate and add padding if needed
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
      console.log(`Adding ${padding.length} padding characters`);
      
      // Convert URL-safe base64 to standard base64
      const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      
      console.log('Base64 conversion completed');
  
      // Decode base64 to binary string
      let rawData;
      try {
        rawData = window.atob(base64);
        console.log(`Successfully decoded base64, raw length: ${rawData.length}`);
      } catch (atobError) {
        console.error('Failed to decode base64:', atobError);
        throw new Error('Invalid base64 encoding in VAPID key');
      }
      
      // Convert binary string to Uint8Array
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      
      // Validate the output array has reasonable length
      if (outputArray.length < 8) { // VAPID keys should be longer than this
        console.error('Converted VAPID key is too short, likely invalid');
        throw new Error('Invalid VAPID key: converted key is too short');
      }
      
      console.log(`Successfully created Uint8Array with length: ${outputArray.length}`);
      return outputArray;
    } catch (error) {
      console.error('Error converting VAPID key:', error);
      throw new Error('Failed to process VAPID key: ' + (error instanceof Error ? error.message : 'unknown error'));
    }
  }
}

// Create a singleton instance
const notificationService = new NotificationService();
export default notificationService;