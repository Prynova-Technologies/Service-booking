import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import bookingService from '../services/bookingService';
import authService from '../services/authService';
import serviceService from '../services/serviceService';

interface BookingFormData {
  date: string;
  time: string;
  address: string;
  notes: string;
  name?: string;
  email?: string;
  phone?: string;
}

const BookingForm: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  
  // State for service details
  const [serviceDetails, setServiceDetails] = useState<{
    _id: string;
    name: string;
    price: string;
    iconName?: string;
    startingPrice: number;
  } | null>(null);
  
  const [loading, setLoading] = useState(true);
  
  // Fetch service details
  useEffect(() => {
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      // Redirect to login page if not authenticated
      navigate('/login');
      return;
    }
    
    const fetchServiceDetails = async () => {
      if (!serviceId) return;
      
      try {
        // Fetch real service details from the API
        const service = await serviceService.getServiceById(serviceId);
        
        if (!service) {
          setError('Service not found');
          return;
        }
        
        // Format the price for display
        const formattedPrice = `$${service.price.toLocaleString()}`;
        
        setServiceDetails({
          _id: service._id,
          name: service.name,
          price: formattedPrice,
          iconName: service.iconName,
          startingPrice: service.startingPrice,
        });
      } catch (err) {
        console.error('Failed to fetch service details:', err);
        setError('Failed to load service details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchServiceDetails();
  }, [serviceId]);

  const [formData, setFormData] = useState<BookingFormData>({
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '10:00',
    address: '',
    notes: '',
    name: '',
    email: '',
    phone: ''
  });
  
  // Prefill user details if authenticated
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || ''
      }));
    }
  }, []);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!serviceDetails) {
      setError('Service details not available. Please try again.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Create booking using the bookingService
      await bookingService.createBooking({
        serviceId: serviceDetails._id,
        date: formData.date,
        time: formData.time,
        address: formData.address,
        notes: formData.notes
      });
      
      // Redirect to bookings page after successful booking
      navigate('/bookings');
    } catch (err) {
      console.error('Failed to book service:', err);
      setError('Failed to book service. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate time slots from 8 AM to 6 PM
  const timeSlots = [];
  for (let hour = 8; hour <= 18; hour++) {
    const formattedHour = hour.toString().padStart(2, '0');
    timeSlots.push(`${formattedHour}:00`);
    if (hour < 18) {
      timeSlots.push(`${formattedHour}:30`);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-indigo-600">
          {loading ? 'Loading...' : serviceDetails ? `Book ${serviceDetails.name}` : 'Book Service'}
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : serviceDetails ? (
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 pb-4 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold">{serviceDetails.name}</h2>
                <p className="text-indigo-600 font-medium">Starting Price: {serviceDetails.price}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-red-600">
              <p>Service not found. Please go back and select a valid service.</p>
            </div>
          )}
          
          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
              
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  required
                  min={format(new Date(), 'yyyy-MM-dd')}
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <select
                  id="time"
                  name="time"
                  required
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {timeSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Service Address</label>
              <input
                type="text"
                id="address"
                name="address"
                required
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || loading || !serviceDetails}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 order-1 sm:order-2"
              >
                {isLoading ? 'Processing...' : 'Confirm Booking'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;