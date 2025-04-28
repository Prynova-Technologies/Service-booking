import express from 'express';
import { isAdmin } from '../middleware/auth.middleware';
import {
  // Off-duty periods
  getAllOffDutyPeriods,
  createOffDutyPeriod,
  updateOffDutyPeriod,
  deleteOffDutyPeriod,
  getOffDutyPeriodById,
  checkDateAvailability,
  
  // Working hours
  getAllWorkingHours,
  createWorkingHours,
  updateWorkingHours,
  deleteWorkingHours,
  updateAllWorkingHours,
  
  // Booking settings
  getBookingSettings,
  updateBookingSettings
} from '../controllers/settings.controller';

const router = express.Router();

// Apply admin authentication middleware to all routes
// router.use(isAdmin);

// Off-duty period routes
router.get('/off-duty', getAllOffDutyPeriods);
router.post('/off-duty', createOffDutyPeriod);
router.get('/off-duty/:id', getOffDutyPeriodById);
router.put('/off-duty/:id', updateOffDutyPeriod);
router.delete('/off-duty/:id', deleteOffDutyPeriod);

// Working hours routes
router.get('/working-hours', getAllWorkingHours);
router.post('/working-hours', createWorkingHours);
router.put('/working-hours/bulk', updateAllWorkingHours);
router.put('/working-hours/:id', updateWorkingHours);
router.delete('/working-hours/:id', deleteWorkingHours);

// Booking settings routes
router.get('/booking', getBookingSettings);
router.put('/booking', updateBookingSettings);

// Utility routes
router.get('/check-availability', checkDateAvailability);

export default router;