import React, { useState, useEffect } from 'react';
import notificationService from '../services/notificationService';

interface NotificationPermissionProps {
  onPermissionChange?: (permission: NotificationPermission) => void;
}

const NotificationPermission: React.FC<NotificationPermissionProps> = ({ onPermissionChange }) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  
  useEffect(() => {
    // Check current permission status on mount
    if ('Notification' in window) {
      setPermission(Notification.permission);
      if (onPermissionChange) {
        onPermissionChange(Notification.permission);
      }
    }
  }, [onPermissionChange]);
  
  const requestPermission = async () => {
    const result = await notificationService.checkNotificationPermission();
    const newPermission = result ? 'granted' : 'denied';
    setPermission(newPermission);
    
    if (result) {
      // If permission granted, subscribe to push notifications
      await notificationService.subscribeToPushNotifications();
    }
    
    if (onPermissionChange) {
      onPermissionChange(newPermission);
    }
  };
  
  // Don't render anything if notifications are not supported
  if (!('Notification' in window)) {
    return null;
  }
  
  // Don't render anything if permission is already granted
  if (permission === 'granted') {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 z-50 border border-indigo-100">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div className="ml-3 w-70 flex-1">
          <p className="text-sm font-medium text-gray-900">Enable notifications</p>
          <p className="mt-1 text-sm text-gray-500">
            Get notified when your booking status changes.
          </p>
          <div className="mt-4 flex">
            <button
              type="button"
              onClick={requestPermission}
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Enable
            </button>
            <button
              type="button"
              onClick={() => setPermission('denied')}
              className="ml-3 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPermission;