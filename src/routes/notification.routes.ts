import express from 'express';
import { subscribe, unsubscribe, getVapidPublicKey } from '../controllers/notification.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

// Public routes
router.get('/vapid-public-key', getVapidPublicKey);

// Protected routes
router.post('/subscribe', protect, subscribe);
router.delete('/unsubscribe', protect, unsubscribe);

export default router;