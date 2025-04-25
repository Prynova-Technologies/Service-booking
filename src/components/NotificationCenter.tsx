import React, { useState, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import notificationService from '../services/notificationService';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: 'booking_status' | 'system' | 'other';
  relatedId?: string; // For linking to related content (e.g., booking ID)
}

interface NotificationCenterProps {
  onNotificationClick?: (notification: Notification) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNotificationClick }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  
  useEffect(() => {
    // Check notification permission on component mount
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
    
    // Load notifications from localStorage
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
    
    // Listen for new notifications from the service worker
    const handleNewNotification = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NEW_NOTIFICATION') {
        addNotification(event.data.notification);
      }
    };
    
    navigator.serviceWorker.addEventListener('message', handleNewNotification);
    
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleNewNotification);
    };
  }, []);
  
  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);
  
  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
  };
  
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };
  
  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
    setShowNotifications(false);
  };
  
  const requestPermission = async () => {
    const permission = await notificationService.checkNotificationPermission();
    setPermissionStatus(permission ? 'granted' : 'denied');
    
    if (permission) {
      await notificationService.subscribeToPushNotifications();
    }
  };
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <div className="relative">
      <button 
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-1 rounded-full text-gray-600 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center transform -translate-y-1/2 translate-x-1/2">
            {unreadCount}
          </span>
        )}
      </button>
      
      {showNotifications && (
        <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          <div className="py-1">
            <div className="px-4 py-2 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                {permissionStatus !== 'granted' && (
                  <button 
                    onClick={requestPermission}
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    Enable notifications
                  </button>
                )}
              </div>
            </div>
            
            {notifications.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                No notifications yet
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto">
                {notifications.map(notification => (
                  <div 
                    key={notification.id} 
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${!notification.read ? 'bg-indigo-50' : ''}`}
                  >
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;