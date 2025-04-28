import { io, Socket } from 'socket.io-client';
import notificationService from './notificationService';
import authService from './authService';

class SocketService {
  private socket: Socket | null = null;
  private connected: boolean = false;
  
  // Initialize the socket connection
  initialize(): void {
    if (this.socket) return; // Already initialized
    
    // Connect to the backend server
    // In a real app, this would be your backend server URL
    const SOCKET_URL = import.meta.env.VITE_API_BASE_URL;
    
    this.socket = io(SOCKET_URL, {
      autoConnect: false,
      withCredentials: true,
    });
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Initialize service worker communication
    this.initServiceWorkerCommunication();
    
    // Connect if user is authenticated
    if (authService.isAuthenticated()) {
      this.connect();
    }
  }
  
  // Initialize communication with service worker
  private initServiceWorkerCommunication(): void {
    // Set up listener for visibility change to handle background/foreground transitions
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        console.log('App is in foreground, updating socket status');
        this.updateServiceWorkerSocketStatus(this.connected);
      }
    });
    
    // Initial status update
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      this.updateServiceWorkerSocketStatus(this.connected);
    }
  }
  
  // Connect to the socket server
  connect(): void {
    if (!this.socket || this.connected) return;
    
    this.socket.connect();
    this.connected = true;
    
    // Get the user token for authentication
    const token = authService.getAuthToken();
    
    if (token) {
      // Authenticate the socket connection
      this.socket.emit('authenticate', { token });
    }
  }
  
  // Disconnect from the socket server
  disconnect(): void {
    if (!this.socket || !this.connected) return;
    
    this.socket.disconnect();
    this.connected = false;
  }
  
  // Set up socket event listeners
  // Update service worker about socket connection status
  private updateServiceWorkerSocketStatus(connected: boolean): void {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SOCKET_STATUS',
        connected
      });
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;
    
    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.connected = true;
      
      // Notify service worker about socket connection status
      this.updateServiceWorkerSocketStatus(true);
    });
    
    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.connected = false;
      
      // Notify service worker about socket disconnection
      this.updateServiceWorkerSocketStatus(false);
    });
    
    // Handle booking notifications
    this.socket.on('booking_status_changed', (data) => {
      const { bookingId, serviceName, status, cancellationReason } = data;
      
      // Create a notification using the notification service
      notificationService.notifyBookingStatusChange(
        bookingId,
        serviceName,
        status,
        cancellationReason
      );
    });
    
    // Handle general notifications
    this.socket.on('notification', (data) => {
      notificationService.addNotification({
        title: data.title || 'New Notification',
        message: data.message || '',
        type: data.type || 'system',
        relatedId: data.relatedId
      });
    });
    
    // Handle errors
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }
  
  // Send a message through the socket
  emit(event: string, data: any): void {
    if (!this.socket || !this.connected) {
      console.warn('Socket not connected, cannot emit event:', event);
      return;
    }
    
    this.socket.emit(event, data);
  }
}

// Create a singleton instance
const socketService = new SocketService();
export default socketService;