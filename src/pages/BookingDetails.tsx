import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import notificationService from '../services/notificationService';
import bookingService, { Booking } from '../services/bookingService';
import authService from '../services/authService';

// Using the Booking interface from bookingService

const BookingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      // Redirect to login page if not authenticated
      navigate('/login');
      return;
    }
    
    fetchBookingDetails(id);
  }, [id, navigate]);

  const fetchBookingDetails = async (bookingId: string | undefined) => {
    if (!bookingId) {
      setError('Invalid booking ID');
      setLoading(false);
      return;
    }

    try {
      const response = await bookingService.getBookingById(bookingId);
      
      if (!response) {
        setError('Booking not found');
      } else {
        setBooking(response);
      }
    } catch (err) {
      console.error('Failed to fetch booking details:', err);
      setError('Failed to fetch booking details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to update booking status
  const updateBookingStatus = async (newStatus: Booking['status'], completedPrice?: number) => {
    if (!booking) return;
    
    try {
      setLoading(true);
      
      let updatedBooking;
      
      if (newStatus === 'cancelled') {
        // Use the cancelBooking method from the service
        updatedBooking = await bookingService.cancelBooking(booking._id);
      } else {
        // For other status updates, we would need additional API methods
        // This is a placeholder for future implementation
        // In a real app, you would call the appropriate API endpoint
        console.warn('Status update not fully implemented for:', newStatus);
        
        // For now, just update the local state
        updatedBooking = { ...booking, status: newStatus };
        
        // If status is completed and completedPrice is provided, update it
        if (newStatus === 'completed' && completedPrice) {
          updatedBooking.completedPrice = completedPrice;
        }
      }
      
      setBooking(updatedBooking);
      
      // Send notification about status change
      notificationService.notifyBookingStatusChange(
        updatedBooking._id,
        updatedBooking.service.name,
        newStatus
      );
      
    } catch (err) {
      console.error('Failed to update booking status:', err);
      setError('Failed to update booking status. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // State for completed price input
  const [completedPrice, setCompletedPrice] = useState<number | undefined>(undefined);

  const getStatusBadgeClass = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading booking details...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
            <Link to="/bookings" className="mt-4 inline-block text-indigo-600 hover:text-indigo-900 font-medium">
              Return to Bookings
            </Link>
          </div>
        ) : booking ? (
          <>
            <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-indigo-600">Booking Details</h1>
          <Link
            to="/bookings"
            className="text-indigo-600 hover:text-indigo-900 font-medium"
          >
            Back to Bookings
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{booking.service.name}</h2>
              <p className="text-lg font-medium text-indigo-600 mt-1">Starting Price: ${booking.startingPrice.toLocaleString()}</p>
              {booking.completedPrice && (
                <p className="text-lg font-medium text-green-600 mt-1">Final Price: ${booking.completedPrice.toLocaleString()}</p>
              )}
            </div>
            <span
              className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeClass(
                booking.status
              )}`}
            >
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Booking ID</span>
              <span className="text-gray-900 font-medium">{booking._id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date</span>
              <span className="text-gray-900 font-medium">{booking.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Time</span>
              <span className="text-gray-900 font-medium">{booking.time}</span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            {booking.status === 'pending' && (
              <div className="space-y-3">
                <button
                  onClick={() => updateBookingStatus('cancelled')}
                  className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Cancel Booking
                </button>
              </div>
            )}
            
            {booking.status === 'confirmed' && (
              <div className="space-y-3">
                <button
                  onClick={() => updateBookingStatus('cancelled')}
                  className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Cancel Booking
                </button>
              </div>
            )}
          </div>
        </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default BookingDetails;