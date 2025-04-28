import { Request, Response } from 'express';
import { saveSubscription, deleteSubscription } from '../services/notification.service';
import logger from '../utils/logger';

/**
 * Subscribe to push notifications
 * @route POST /api/notifications/subscribe
 * @access Private
 */
export const subscribe = async (req: Request, res: Response) => {
  try {
    const subscription = req.body;
    const userId = req.user._id;

    // Validate subscription object
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      // Log invalid subscription attempt
      logger.warn('Push notification subscription failed - invalid subscription object', {
        userId: req.user._id,
        ip: req.ip
      });

      return res.status(400).json({
        success: false,
        message: 'Invalid subscription object',
      });
    }

    // Log subscription attempt
    logger.info('User subscribing to push notifications', {
      userId: req.user._id,
      endpoint: subscription.endpoint.substring(0, 50) + '...',
      ip: req.ip
    });

    // Save subscription
    const savedSubscription = await saveSubscription(userId, subscription);

    // Log successful subscription
    logger.info('User successfully subscribed to push notifications', {
      userId: req.user._id,
      subscriptionId: savedSubscription._id,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      data: savedSubscription,
    });
  } catch (error: any) {
    // Log error
    logger.error('Error subscribing to push notifications', { 
      userId: req.user?._id,
      error: error.message, 
      stack: error.stack 
    });

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

/**
 * Unsubscribe from push notifications
 * @route DELETE /api/notifications/unsubscribe
 * @access Private
 */
export const unsubscribe = async (req: Request, res: Response) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      // Log invalid unsubscription attempt
      logger.warn('Push notification unsubscription failed - missing endpoint', {
        userId: req.user._id,
        ip: req.ip
      });

      return res.status(400).json({
        success: false,
        message: 'Endpoint is required',
      });
    }

    // Log unsubscription attempt
    logger.info('User unsubscribing from push notifications', {
      userId: req.user._id,
      endpoint: endpoint.substring(0, 50) + '...',
      ip: req.ip
    });

    // Delete subscription
    await deleteSubscription(endpoint);

    // Log successful unsubscription
    logger.info('User successfully unsubscribed from push notifications', {
      userId: req.user._id,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error: any) {
    // Log error
    logger.error('Error unsubscribing from push notifications', { 
      userId: req.user?._id,
      error: error.message, 
      stack: error.stack 
    });

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

/**
 * Get VAPID public key
 * @route GET /api/notifications/vapid-public-key
 * @access Public
 */
export const getVapidPublicKey = async (req: Request, res: Response) => {
  try {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;

    if (!vapidPublicKey) {
      // Log missing VAPID key configuration
      logger.error('VAPID public key not configured', {
        ip: req.ip
      });

      return res.status(500).json({
        success: false,
        message: 'VAPID public key not configured',
      });
    }

    // Log VAPID key request
    logger.info('VAPID public key requested', {
      userId: req.user?._id,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: { vapidPublicKey },
    });
  } catch (error: any) {
    // Log error
    logger.error('Error retrieving VAPID public key', { 
      error: error.message, 
      stack: error.stack 
    });

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};