import { Request, Response } from 'express';
import Service from '../models/service.model';
import logger from '../utils/logger';

/**
 * Get all services
 * @route GET /api/services
 * @access Public
 */
export const getServices = async (req: Request, res: Response) => {
  try {
    logger.info('Fetching all services');
    const services = await Service.find({ active: true }).sort('name');

    logger.info(`Retrieved ${services.length} services`);
    res.status(200).json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (error: any) {
    logger.error('Error fetching services', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

/**
 * Get a single service
 * @route GET /api/services/:id
 * @access Public
 */
export const getService = async (req: Request, res: Response) => {
  try {
    logger.info(`Fetching service with ID: ${req.params.id}`);
    const service = await Service.findById(req.params.id);

    if (!service) {
      logger.warn(`Service not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    logger.info(`Retrieved service: ${service.name}`);
    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error: any) {
    logger.error(`Error fetching service with ID: ${req.params.id}`, { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

/**
 * Create a new service
 * @route POST /api/services
 * @access Private/Admin
 */
export const createService = async (req: Request, res: Response) => {
  try {
    const { name, description, startingPrice, iconName, image } = req.body;
    logger.info('Creating new service', { name, iconName });

    // Validate required fields
    if (!name || !description || !startingPrice) {
      logger.warn('Invalid service creation attempt - missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Please provide name, description, and price',
      });
    }

    // Create service
    const service = await Service.create({
      name,
      description,
      price: startingPrice,
      iconName: iconName || 'WrenchIcon',
      image,
      active: true,
    });

    logger.info(`Service created successfully with ID: ${service.id}`);
    res.status(201).json({
      success: true,
      data: service,
    });
  } catch (error: any) {
    logger.error('Error creating service', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

/**
 * Update a service
 * @route PUT /api/services/:id
 * @access Private/Admin
 */
export const updateService = async (req: Request, res: Response) => {
  try {
    const { name, description, startingPrice, iconName, image, active } = req.body;
    logger.info(`Updating service with ID: ${req.params.id}`, { name, iconName });

    // Find service
    let service = await Service.findById(req.params.id);

    if (!service) {
      logger.warn(`Update failed - service not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    // Update service
    service = await Service.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        price: startingPrice,
        iconName,
        image,
        active,
      },
      { new: true, runValidators: true }
    );

    logger.info(`Service updated successfully: ${service?.name}`);
    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error: any) {
    logger.error(`Error updating service with ID: ${req.params.id}`, { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

/**
 * Delete a service
 * @route DELETE /api/services/:id
 * @access Private/Admin
 */
export const deleteService = async (req: Request, res: Response) => {
  try {
    logger.info(`Deleting service with ID: ${req.params.id}`);
    const service = await Service.findById(req.params.id);

    if (!service) {
      logger.warn(`Delete failed - service not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    await service.deleteOne();
    logger.info(`Service deleted successfully: ${service.name}`);

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error: any) {
    logger.error(`Error deleting service with ID: ${req.params.id}`, { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};