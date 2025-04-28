import { Request, Response } from 'express';
import OffDutyPeriod from '../models/offDuty.model';
import WorkingHours from '../models/workingHours.model';
import BookingSettings from '../models/bookingSettings.model';
import logger from '../utils/logger';

// Get all off-duty periods
export const getAllOffDutyPeriods = async (req: Request, res: Response) => {
  try {
    const offDutyPeriods = await OffDutyPeriod.find().sort({ startDate: 1 });
    res.status(200).json(offDutyPeriods);
  } catch (error: any) {
    logger.error('Error fetching off-duty periods:', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch off-duty periods', error: error.message });
  }
};

// Create a new off-duty period
export const createOffDutyPeriod = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, reason } = req.body;

    // Validate input
    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Create new off-duty period
    const newOffDutyPeriod = new OffDutyPeriod({
      startDate,
      endDate,
      reason,
    });

    await newOffDutyPeriod.save();
    
    logger.info('New off-duty period created', { id: newOffDutyPeriod._id });
    res.status(201).json(newOffDutyPeriod);
  } catch (error: any) {
    logger.error('Error creating off-duty period:', { error: error.message });
    res.status(500).json({ message: 'Failed to create off-duty period', error: error.message });
  }
};

// Update an off-duty period
export const updateOffDutyPeriod = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, reason } = req.body;

    // Validate input
    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Find and update the off-duty period
    const updatedOffDutyPeriod = await OffDutyPeriod.findByIdAndUpdate(
      id,
      { startDate, endDate, reason },
      { new: true, runValidators: true }
    );

    if (!updatedOffDutyPeriod) {
      return res.status(404).json({ message: 'Off-duty period not found' });
    }

    logger.info('Off-duty period updated', { id });
    res.status(200).json(updatedOffDutyPeriod);
  } catch (error: any) {
    logger.error('Error updating off-duty period:', { error: error.message });
    res.status(500).json({ message: 'Failed to update off-duty period', error: error.message });
  }
};

// Delete an off-duty period
export const deleteOffDutyPeriod = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Find and delete the off-duty period
    const deletedOffDutyPeriod = await OffDutyPeriod.findByIdAndDelete(id);

    if (!deletedOffDutyPeriod) {
      return res.status(404).json({ message: 'Off-duty period not found' });
    }

    logger.info('Off-duty period deleted', { id });
    res.status(200).json({ message: 'Off-duty period deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting off-duty period:', { error: error.message });
    res.status(500).json({ message: 'Failed to delete off-duty period', error: error.message });
  }
};

// Get a single off-duty period by ID
export const getOffDutyPeriodById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const offDutyPeriod = await OffDutyPeriod.findById(id);

    if (!offDutyPeriod) {
      return res.status(404).json({ message: 'Off-duty period not found' });
    }

    res.status(200).json(offDutyPeriod);
  } catch (error: any) {
    logger.error('Error fetching off-duty period:', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch off-duty period', error: error.message });
  }
};

// Check if a date range overlaps with any off-duty periods
export const checkDateAvailability = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Find any off-duty periods that overlap with the given date range
    const overlappingPeriods = await OffDutyPeriod.find({
      $or: [
        // Case 1: Start date falls within an off-duty period
        { startDate: { $lte: start }, endDate: { $gte: start } },
        // Case 2: End date falls within an off-duty period
        { startDate: { $lte: end }, endDate: { $gte: end } },
        // Case 3: Off-duty period falls completely within the given range
        { startDate: { $gte: start }, endDate: { $lte: end } }
      ]
    });

    const isAvailable = overlappingPeriods.length === 0;

    res.status(200).json({
      isAvailable,
      overlappingPeriods: isAvailable ? [] : overlappingPeriods
    });
  } catch (error: any) {
    logger.error('Error checking date availability:', { error: error.message });
    res.status(500).json({ message: 'Failed to check date availability', error: error.message });
  }
};

// Working Hours Controllers

// Get all working hours
export const getAllWorkingHours = async (req: Request, res: Response) => {
  try {
    const workingHours = await WorkingHours.find().sort({ dayOfWeek: 1 });
    
    // If no working hours are found, initialize with default values
    if (workingHours.length === 0) {
      const defaultWorkingHours = [
        { dayOfWeek: 'monday', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
        { dayOfWeek: 'tuesday', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
        { dayOfWeek: 'wednesday', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
        { dayOfWeek: 'thursday', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
        { dayOfWeek: 'friday', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
        { dayOfWeek: 'saturday', startTime: '10:00', endTime: '15:00', isWorkingDay: false },
        { dayOfWeek: 'sunday', startTime: '10:00', endTime: '15:00', isWorkingDay: false }
      ];
      
      await WorkingHours.insertMany(defaultWorkingHours);
      return res.status(200).json(defaultWorkingHours);
    }
    
    res.status(200).json(workingHours);
  } catch (error: any) {
    logger.error('Error fetching working hours:', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch working hours', error: error.message });
  }
};

// Create a new working hours entry
export const createWorkingHours = async (req: Request, res: Response) => {
  try {
    const { dayOfWeek, startTime, endTime, isWorkingDay } = req.body;

    // Validate input
    if (!dayOfWeek || !startTime || !endTime === undefined || isWorkingDay === undefined) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if entry for this day already exists
    const existingEntry = await WorkingHours.findOne({ dayOfWeek });
    if (existingEntry) {
      return res.status(400).json({ message: `Working hours for ${dayOfWeek} already exist` });
    }

    // Create new working hours entry
    const newWorkingHours = new WorkingHours({
      dayOfWeek,
      startTime,
      endTime,
      isWorkingDay,
    });

    await newWorkingHours.save();
    
    logger.info('New working hours created', { id: newWorkingHours._id });
    res.status(201).json(newWorkingHours);
  } catch (error: any) {
    logger.error('Error creating working hours:', { error: error.message });
    res.status(500).json({ message: 'Failed to create working hours', error: error.message });
  }
};

// Update working hours
export const updateWorkingHours = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { startTime, endTime, isWorkingDay } = req.body;
    console.log(isWorkingDay)

    // Validate input
    if (!startTime || !endTime === undefined || isWorkingDay === undefined) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Find and update the working hours
    const updatedWorkingHours = await WorkingHours.findByIdAndUpdate(
      id,
      { startTime, endTime, isWorkingDay },
      { new: true, runValidators: true }
    );

    if (!updatedWorkingHours) {
      return res.status(404).json({ message: 'Working hours not found' });
    }

    logger.info('Working hours updated', { id });
    res.status(200).json(updatedWorkingHours);
  } catch (error: any) {
    logger.error('Error updating working hours:', { error: error.message });
    res.status(500).json({ message: 'Failed to update working hours', error: error.message });
  }
};

// Delete working hours
export const deleteWorkingHours = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Find and delete the working hours
    const deletedWorkingHours = await WorkingHours.findByIdAndDelete(id);

    if (!deletedWorkingHours) {
      return res.status(404).json({ message: 'Working hours not found' });
    }

    logger.info('Working hours deleted', { id });
    res.status(200).json({ message: 'Working hours deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting working hours:', { error: error.message });
    res.status(500).json({ message: 'Failed to delete working hours', error: error.message });
  }
};

// Update all working hours in bulk
export const updateAllWorkingHours = async (req: Request, res: Response) => {
  try {
    const workingHoursData = req.body;
    
    if (!Array.isArray(workingHoursData) || workingHoursData.length !== 7) {
      return res.status(400).json({ message: 'Invalid data format. Expected an array of 7 working hours entries.' });
    }
    
    // Validate each entry
    for (const entry of workingHoursData) {
      if (!entry.dayOfWeek || !entry.startTime || !entry.endTime === undefined || entry.isWorkingDay === undefined) {
        return res.status(400).json({ message: 'All fields are required for each entry' });
      }
    }
    
    // Delete all existing entries
    await WorkingHours.deleteMany({});
    
    // Create new entries
    const newWorkingHours = await WorkingHours.insertMany(workingHoursData);
    
    logger.info('All working hours updated');
    res.status(200).json(newWorkingHours);
  } catch (error: any) {
    logger.error('Error updating all working hours:', { error: error.message });
    res.status(500).json({ message: 'Failed to update all working hours', error: error.message });
  }
};

// Booking Settings Controllers

// Get booking settings
export const getBookingSettings = async (req: Request, res: Response) => {
  try {
    let bookingSettings = await BookingSettings.findOne();
    
    // If no settings exist, create default settings
    if (!bookingSettings) {
      bookingSettings = await BookingSettings.create({
        maxBookingsPerDay: 10,
        timeBufferMinutes: 60
      });
    }
    
    res.status(200).json(bookingSettings);
  } catch (error: any) {
    logger.error('Error fetching booking settings:', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch booking settings', error: error.message });
  }
};

// Update booking settings
export const updateBookingSettings = async (req: Request, res: Response) => {
  try {
    const { maxBookingsPerDay, timeBufferMinutes } = req.body;

    // Validate input
    if (maxBookingsPerDay === undefined || timeBufferMinutes === undefined) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Find existing settings or create new ones
    let bookingSettings = await BookingSettings.findOne();
    
    if (bookingSettings) {
      // Update existing settings
      bookingSettings.maxBookingsPerDay = maxBookingsPerDay;
      bookingSettings.timeBufferMinutes = timeBufferMinutes;
      await bookingSettings.save();
    } else {
      // Create new settings
      bookingSettings = await BookingSettings.create({
        maxBookingsPerDay,
        timeBufferMinutes
      });
    }

    logger.info('Booking settings updated');
    res.status(200).json(bookingSettings);
  } catch (error: any) {
    logger.error('Error updating booking settings:', { error: error.message });
    res.status(500).json({ message: 'Failed to update booking settings', error: error.message });
  }
};