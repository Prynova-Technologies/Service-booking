import { Request, Response } from 'express';
import { saveSubscription, deleteSubscription } from '../services/notification.service';

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
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription object',
      });
    }

    // Save subscription
    const savedSubscription = await saveSubscription(userId, subscription);

    res.status(201).json({
      success: true,
      data: savedSubscription,
    });
  } catch (error: any) {
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
      return res.status(400).json({
        success: false,
        message: 'Endpoint is required',
      });
    }

    // Delete subscription
    await deleteSubscription(endpoint);

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error: any) {
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
      return res.status(500).json({
        success: false,
        message: 'VAPID public key not configured',
      });
    }

    res.status(200).json({
      success: true,
      data: { vapidPublicKey },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};