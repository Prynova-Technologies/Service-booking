import { Server, Socket } from 'socket.io';
import { BookingStatus } from '../models/booking.model';
import { sendPushNotification } from '../services/notification.service';
import logger from '../utils/logger';

// Map to store user connections
const userConnections = new Map<string, string[]>();

export const setupSocketHandlers = (io: Server): void => {
  io.on('connection', (socket: Socket) => {
    logger.info('New client connected:', { socketId: socket.id });

    // Handle user authentication and room joining
    socket.on('authenticate', (userId: string) => {
      // Add this socket to the user's connections
      if (userConnections.has(userId)) {
        userConnections.get(userId)?.push(socket.id);
      } else {
        userConnections.set(userId, [socket.id]);
      }

      // Join a room specific to this user for targeted messages
      socket.join(`user:${userId}`);
      logger.info(`User ${userId} authenticated and joined room`);
    });

    // Handle booking status updates
    socket.on('booking:statusUpdate', async (data: {
      bookingId: string;
      userId: string;
      status: BookingStatus;
      serviceName: string;
    }) => {
      const { bookingId, userId, status, serviceName } = data;
      
      // Emit to the specific user's room
      io.to(`user:${userId}`).emit('notification', {
        type: 'booking_status',
        title: 'Booking Update',
        message: `Your booking for ${serviceName} has been ${status}`,
        relatedId: bookingId,
        timestamp: Date.now()
      });

      // Also send push notification if the user is not connected
      try {
        await sendPushNotification(userId, {
          title: 'Booking Update',
          body: `Your booking for ${serviceName} has been ${status}`,
          data: {
            type: 'booking_status',
            bookingId
          }
        });
      } catch (error) {
        logger.error('Failed to send push notification:', { error: error.message });
      }
    });

    // Handle admin notifications
    socket.on('admin:newBooking', (data: {
      bookingId: string;
      serviceName: string;
      customerName: string;
    }) => {
      // Emit to admin room
      io.to('admin').emit('notification', {
        type: 'new_booking',
        title: 'New Booking',
        message: `${data.customerName} has booked ${data.serviceName}`,
        relatedId: data.bookingId,
        timestamp: Date.now()
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info('Client disconnected:', { socketId: socket.id });
      
      // Remove this socket from userConnections
      for (const [userId, sockets] of userConnections.entries()) {
        const index = sockets.indexOf(socket.id);
        if (index !== -1) {
          sockets.splice(index, 1);
          if (sockets.length === 0) {
            userConnections.delete(userId);
          }
          break;
        }
      }
    });
  });
};

// Helper function to check if a user is online
export const isUserOnline = (userId: string): boolean => {
  return userConnections.has(userId) && userConnections.get(userId)!.length > 0;
};