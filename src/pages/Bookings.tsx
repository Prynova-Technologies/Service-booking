import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import bookingService, { Booking } from '../services/bookingService';
import authService from '../services/authService';

// Using the Booking interface from bookingService

const Bookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      // Redirect to login page if not authenticated
      navigate('/login');
      return;
    }
    
    const fetchBookings = async () => {
      try {
        const data = await bookingService.getBookings();
        setBookings(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch bookings:', err);
        setError('Failed to load your bookings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

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
      <h1 className="text-3xl font-bold text-center mb-8 text-indigo-600">My Bookings</h1>
      
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Loading your bookings...</p>
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">
          <p className="mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">You don't have any bookings yet.</p>
          <Link to="/services" className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700 transition-colors">
            Browse Services
          </Link>
        </div>
      ) : (
        <>
          {/* Table view for medium screens and up */}
          <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <tr key={booking._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{booking.service.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{booking.date}</div>
                      <div className="text-sm text-gray-500">{booking.time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(booking.status)}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>${booking.startingPrice.toLocaleString()}</div>
                      {booking.completedPrice && (
                        <div className="text-green-600">Final: ${booking.completedPrice.toLocaleString()}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/bookings/${booking._id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">View</Link>
                      {booking.status === 'pending' && (
                        <button 
                          onClick={() => {
                            if(window.confirm('Are you sure you want to cancel this booking?')) {
                              bookingService.cancelBooking(booking._id)
                                .then(() => {
                                  // Update the booking status in the UI
                                  setBookings(prevBookings => 
                                    prevBookings.map(b => 
                                      b._id === booking._id ? {...b, status: 'cancelled'} : b
                                    )
                                  );
                                })
                                .catch(err => {
                                  console.error('Failed to cancel booking:', err);
                                  alert('Failed to cancel booking. Please try again.');
                                });
                            }
                          }} 
                          className="text-red-600 hover:text-red-900 cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Card view for small screens */}
          <div className="md:hidden space-y-4">
            {bookings.map((booking) => (
              <div key={booking._id} className="bg-white rounded-lg shadow-md p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium text-gray-900">{booking.service.name}</h3>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(booking.status)}`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>
                <div className="mb-2">
                  <div className="text-sm text-gray-600">Date: <span className="text-gray-900">{booking.date}</span></div>
                  <div className="text-sm text-gray-600">Time: <span className="text-gray-900">{booking.time}</span></div>
                  <div className="text-sm text-gray-600">Price: <span className="text-gray-900">${booking.startingPrice.toLocaleString()}</span></div>
                  {booking.completedPrice && (
                    <div className="text-sm text-gray-600">Final Price: <span className="text-green-600">${booking.completedPrice.toLocaleString()}</span></div>
                  )}
                </div>
                <div className="flex justify-end space-x-3 mt-3 pt-3 border-t border-gray-200">
                  <Link to={`/bookings/${booking._id}`} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">View</Link>
                  {booking.status === 'pending' && (
                    <button 
                      onClick={() => {
                        if(window.confirm('Are you sure you want to cancel this booking?')) {
                          bookingService.cancelBooking(booking._id)
                            .then(() => {
                              // Update the booking status in the UI
                              setBookings(prevBookings => 
                                prevBookings.map(b => 
                                  b._id === booking._id ? {...b, status: 'cancelled'} : b
                                )
                              );
                            })
                            .catch(err => {
                              console.error('Failed to cancel booking:', err);
                              alert('Failed to cancel booking. Please try again.');
                            });
                        }
                      }} 
                      className="text-red-600 hover:text-red-900 text-sm font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Bookings;