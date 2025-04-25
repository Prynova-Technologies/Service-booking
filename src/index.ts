import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import webpush from 'web-push';

// Import logger and middleware
import logger from './utils/logger';
import { applyLoggerMiddleware, logApiRequest } from './middleware/logger.middleware';

// Import routes
import authRoutes from './routes/auth.routes';
import serviceRoutes from './routes/service.routes';
import bookingRoutes from './routes/booking.routes';
import userRoutes from './routes/user.routes';
import notificationRoutes from './routes/notification.routes';

// Import socket handler
import { setupSocketHandlers } from './socket/socketHandlers';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Setup web-push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:example@example.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn('VAPID keys not set. Push notifications will not work.');
}

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://service-booking-97bw.onrender.com/api/',
  credentials: true
}));
app.use(express.json());

// Apply logger middleware
app.use(logApiRequest);


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Setup Socket.io handlers
setupSocketHandlers(io);

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI;
mongoose.connect(MONGODB_URI)
  .then(() => {
    logger.info('Connected to MongoDB');
    
    // Start the server
    const PORT = process.env.PORT || 5500;
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error('MongoDB connection error:', { error: error.message });
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (error: any) => {
  logger.error('Unhandled Rejection:', { error: error.message, stack: error.stack });
});

// Apply error handling middleware (should be last)
applyLoggerMiddleware(app);

// Export for testing purposes
export { app, server, io };