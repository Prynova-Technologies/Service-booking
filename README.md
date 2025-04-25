# Rashad Service Booking Backend

This is the backend for the Rashad Service Booking application. It provides APIs for user authentication, service management, booking management, and real-time notifications using Socket.io.

## Technologies Used

- Node.js
- Express
- TypeScript
- MongoDB with Mongoose
- Socket.io for real-time notifications
- Web Push for push notifications
- JWT for authentication

## Features

- User authentication (register, login, admin login)
- Service management (create, update, delete, list services)
- Booking management (create, update status, list bookings)
- Real-time notifications via Socket.io
- Push notifications for booking status changes

## Project Structure

```
src/
├── controllers/     # Request handlers
├── middleware/      # Express middleware
├── models/          # Mongoose models
├── routes/          # Express routes
├── services/        # Business logic
├── socket/          # Socket.io handlers
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── index.ts         # Application entry point
```

## Setup Instructions

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file based on `.env.example`
4. Generate VAPID keys for push notifications using the provided script:
   ```
   npm run generate-vapid-keys
   ```
   This will automatically add the generated keys to your `.env` file
6. Start the development server: `npm run dev`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `POST /api/auth/admin/login` - Login as admin

### Services
- `GET /api/services` - Get all services
- `GET /api/services/:id` - Get a specific service
- `POST /api/services` - Create a new service (admin only)
- `PUT /api/services/:id` - Update a service (admin only)
- `DELETE /api/services/:id` - Delete a service (admin only)

### Bookings
- `GET /api/bookings` - Get user's bookings
- `GET /api/bookings/:id` - Get a specific booking
- `POST /api/bookings` - Create a new booking
- `PATCH /api/bookings/:id/status` - Update booking status (admin only)

### Notifications
- `POST /api/notifications/subscribe` - Subscribe to push notifications
- `DELETE /api/notifications/unsubscribe` - Unsubscribe from push notifications

## Socket.io Events

### Client to Server
- `authenticate` - Authenticate user with Socket.io
- `booking:statusUpdate` - Update booking status
- `admin:newBooking` - Notify admin of new booking

### Server to Client
- `notification` - Send notification to client

## Integration with Frontend

The backend integrates with the frontend through:
1. RESTful API endpoints for data operations
2. Socket.io for real-time notifications
3. Web Push API for push notifications when the app is in the background

When a booking status changes (accepted, rejected, completed, or cancelled), the backend:
1. Updates the booking in the database
2. Emits a Socket.io event to the user if they're online
3. Sends a push notification if the user is offline