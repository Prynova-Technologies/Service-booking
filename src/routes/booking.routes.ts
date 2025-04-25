import express from 'express';
import { getBookings, getAllBookings, getBooking, createBooking, updateBookingStatus, cancelBooking, getCustomerBookings } from '../controllers/booking.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';

const router = express.Router();

// User routes
router.get('/', protect, getBookings);
router.get('/:id', protect, getBooking);
router.post('/', protect, createBooking);
router.patch('/:id/cancel', protect, cancelBooking);

// Admin only routes
router.get('/admin/all', protect, restrictTo('admin'), getAllBookings);
router.get('/customer/:customerId', protect, restrictTo('admin'), getCustomerBookings);
router.patch('/:id/status', protect, restrictTo('admin'), updateBookingStatus);

export default router;