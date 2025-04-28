import notificationService from '../services/notificationService';

/**
 * Utility functions for displaying toast notifications
 * This replaces react-hot-toast with the existing notification service
 */
export const toast = {
  /**
   * Display a success toast notification
   */
  success: (message: string): void => {
    notificationService.addNotification({
      title: 'Success',
      message,
      type: 'system'
    });
  },

  /**
   * Display an error toast notification
   */
  error: (message: string): void => {
    notificationService.addNotification({
      title: 'Error',
      message,
      type: 'system'
    });
  },

  /**
   * Display an info toast notification
   */
  info: (message: string): void => {
    notificationService.addNotification({
      title: 'Information',
      message,
      type: 'system'
    });
  },

  /**
   * Display a warning toast notification
   */
  warning: (message: string): void => {
    notificationService.addNotification({
      title: 'Warning',
      message,
      type: 'system'
    });
  }
};

export default toast;