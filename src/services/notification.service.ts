import webpush from 'web-push';
import PushSubscription from '../models/push-subscription.model';
import { isUserOnline } from '../socket/socketHandlers';
import logger from '../utils/logger';

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
}

/**
 * Send a push notification to a specific user
 * @param userId The ID of the user to send the notification to
 * @param payload The notification payload
 * @returns Promise that resolves when the notification is sent
 */
export const sendPushNotification = async (
  userId: string,
  payload: PushNotificationPayload
): Promise<void> => {
  try {
    // Check if user is online via socket connection
    // If they are, we don't need to send a push notification
    if (isUserOnline(userId)) {
      logger.info(`User ${userId} is online, skipping push notification`);
      return;
    }

    // Find all subscriptions for this user
    const subscriptions = await PushSubscription.find({ user: userId });

    if (subscriptions.length === 0) {
      logger.info(`No push subscriptions found for user ${userId}`);
      return;
    }

    // Prepare the notification payload
    const notificationPayload = JSON.stringify({
      notification: {
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/pwa-192x192.png',
        badge: payload.badge || '/pwa-192x192.png',
        vibrate: [100, 50, 100],
        data: payload.data || {},
      },
    });

    // Send notifications to all subscriptions
    const sendPromises = subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth,
            },
          },
          notificationPayload
        );
      } catch (error: any) {
        logger.error(`Error sending push notification to subscription ${subscription._id}:`, { error: error.message });
        
        // If subscription is expired or invalid, remove it
        if (error.statusCode === 404 || error.statusCode === 410) {
          logger.info(`Removing invalid subscription ${subscription._id}`);
          await subscription.deleteOne();
        }
      }
    });

    await Promise.all(sendPromises);
  } catch (error) {
    logger.error('Error sending push notification:', { error: error.message });
    throw error;
  }
};

/**
 * Store a new push subscription for a user
 * @param userId The ID of the user
 * @param subscription The push subscription details
 * @returns The saved subscription
 */
export const saveSubscription = async (
  userId: string,
  subscription: webpush.PushSubscription
) => {
  try {
    // Check if subscription already exists
    const existingSubscription = await PushSubscription.findOne({
      endpoint: subscription.endpoint,
    });

    if (existingSubscription) {
      // Update the existing subscription
      existingSubscription.user = userId as any;
      existingSubscription.keys = subscription.keys as any;
      existingSubscription.expirationTime = subscription.expirationTime as any;
      await existingSubscription.save();
      return existingSubscription;
    }

    // Create a new subscription
    const newSubscription = new PushSubscription({
      user: userId,
      endpoint: subscription.endpoint,
      expirationTime: subscription.expirationTime,
      keys: subscription.keys,
    });

    await newSubscription.save();
    return newSubscription;
  } catch (error) {
    console.error('Error saving push subscription:', error);
    throw error;
  }
};

/**
 * Delete a push subscription
 * @param endpoint The subscription endpoint to delete
 */
export const deleteSubscription = async (endpoint: string): Promise<void> => {
  try {
    await PushSubscription.deleteOne({ endpoint });
  } catch (error) {
    console.error('Error deleting push subscription:', error);
    throw error;
  }
};