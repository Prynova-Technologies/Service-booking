import express from 'express';
import { generateReceipt, getReceiptById, getReceiptByBookingId, getAllReceipts } from '../controllers/receipt.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';

const router = express.Router();

// All receipt routes require authentication and admin role
router.use(protect);

// Get receipt by booking ID
router.get('/booking/:bookingId', getReceiptByBookingId);

router.use(restrictTo('admin'));

// Get all receipts
router.get('/', getAllReceipts);

// Generate receipt for a completed booking
router.post('/', generateReceipt);

// Get receipt by ID
router.get('/:id', getReceiptById);


export default router;