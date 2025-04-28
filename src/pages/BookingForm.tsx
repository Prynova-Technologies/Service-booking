import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import bookingService, { OffDutyPeriod, Booking } from '../services/bookingService';
import authService from '../services/authService';
import serviceService from '../services/serviceService';
import settingsService, { WorkingHours, BookingSettings } from '../services/settingsService';

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
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);
  const [loadingWorkingHours, setLoadingWorkingHours] = useState(false);
  const [bookingSettings, setBookingSettings] = useState<BookingSettings>({ maxBookingsPerDay: 10, timeBufferMinutes: 60 });
  const [loadingBookingSettings, setLoadingBookingSettings] = useState(false);
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
  const [loadingExistingBookings, setLoadingExistingBookings] = useState(false);
  const [dailyBookingLimitReached, setDailyBookingLimitReached] = useState(false);
  
  // Fetch service details and working hours
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

    const fetchWorkingHours = async () => {
      setLoadingWorkingHours(true);
      try {
        const hours = await settingsService.getWorkingHours();
        setWorkingHours(hours);
      } catch (err) {
        console.error('Failed to fetch working hours:', err);
        // Default to standard hours if we can't fetch working hours
      } finally {
        setLoadingWorkingHours(false);
      }
    };
    
    const fetchBookingSettings = async () => {
      setLoadingBookingSettings(true);
      try {
        const settings = await settingsService.getBookingSettings();
        setBookingSettings(settings);
      } catch (err) {
        console.error('Failed to fetch booking settings:', err);
        // Use default settings if we can't fetch from server
      } finally {
        setLoadingBookingSettings(false);
      }
    };
    
    fetchServiceDetails();
    fetchWorkingHours();
    fetchBookingSettings();
  }, [serviceId, navigate]);

  const [formData, setFormData] = useState<BookingFormData>({
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '10:00',
    address: '',
    notes: '',
    name: '',
    email: '',
    phone: ''
  });
  
  // State for off-duty periods
  const [offDutyPeriods, setOffDutyPeriods] = useState<OffDutyPeriod[]>([]);
  const [dateError, setDateError] = useState('');
  
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
  
  // Fetch off-duty periods
  useEffect(() => {
    const fetchOffDutyPeriods = async () => {
      try {
        const periods = await bookingService.getOffDutyPeriods();
        setOffDutyPeriods(periods);
      } catch (error) {
        console.error('Error fetching off-duty periods:', error);
      }
    };
    
    fetchOffDutyPeriods();
  }, []);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Check if date is within off-duty period when date changes
    if (name === 'date') {
      checkDateAvailability(value);
    }
  };
  
  // Check if selected date is within any off-duty period, check if it's a working day, and check booking limits
  const checkDateAvailability = async (selectedDate: string) => {
    setDateError('');
    setDailyBookingLimitReached(false);
    
    const selected = new Date(selectedDate);
    
    // Check if the selected day is a working day according to admin settings
    const dayOfWeek = getDayOfWeek(selectedDate);
    if (dayOfWeek) {
      const dayHours = workingHours.find(h => h.dayOfWeek === dayOfWeek);
      
      // If no working hours found or it's not a working day, show error
      if (!dayHours || !dayHours.isWorkingDay) {
        setDateError(`Sorry, we are not available on ${dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)}s. Please select another date.`);
        return;
      }
    }
    
    // Check off-duty periods
    for (const period of offDutyPeriods) {
      const startDate = new Date(period.startDate);
      const endDate = new Date(period.endDate);
      
      // Remove time part for comparison
      selected.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      if (selected >= startDate && selected <= endDate) {
        setDateError(`Sorry, this date is unavailable due to: ${period.reason}`);
        return;
      }
    }
    
    // Check if daily booking limit is reached
    setLoadingExistingBookings(true);
    try {
      // Format date for API query (YYYY-MM-DD)
      const formattedDate = format(selected, 'yyyy-MM-dd');
      
      // Fetch bookings for the selected date
      const bookings = await bookingService.getBookings();
      const bookingsOnSelectedDate = bookings.filter(booking => {
        return booking.date.split('T')[0] === formattedDate;
      });
      
      setExistingBookings(bookingsOnSelectedDate);
      
      // Check if booking limit is reached
      if (bookingsOnSelectedDate.length >= bookingSettings.maxBookingsPerDay) {
        setDailyBookingLimitReached(true);
        setDateError(`Sorry, we've reached the maximum number of bookings for this date. Please select another date.`);
      }
    } catch (error) {
      console.error('Error fetching existing bookings:', error);
    } finally {
      setLoadingExistingBookings(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!serviceDetails) {
      setError('Service details not available. Please try again.');
      return;
    }
    
    // Check date availability before submitting
    await checkDateAvailability(formData.date);

    if (dateError) {
      setError('Please select an available date.');
      return;
    }
    
    // Check if daily booking limit is reached
    if (dailyBookingLimitReached) {
      setError('Maximum bookings for this date has been reached. Please select another date.');
      return;
    }
    
    // Check if the selected time slot is still available
    const timeSlots = getTimeSlots();
    if (!timeSlots.includes(formData.time)) {
      setError('The selected time slot is no longer available. Please select another time.');
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

  // Get day of week from selected date and check if it's a working day
  const getDayOfWeek = (dateString: string): WorkingHours['dayOfWeek'] | null => {
    if (!dateString) return null;
    
    // Create a date object from the string with explicit year, month, day components
    // to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    // Note: JavaScript months are 0-indexed (0 = January, 11 = December)
    const date = new Date(year, month - 1, day);
    
    // JavaScript's Date.getDay() returns:
    // 0 = Sunday, 1 = Monday, 2 = Tuesday, etc.
    const dayIndex = date.getDay();
    
    // Map the numeric day index to day name
    const days: WorkingHours['dayOfWeek'][] = [
      'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
    ];
    const dayOfWeek = days[dayIndex];
    
    // Check if this day is a working day according to admin settings
    const dayHours = workingHours.find(h => h.dayOfWeek === dayOfWeek);
    if (!dayHours || !dayHours.isWorkingDay) {
      // Not a working day, but we still return the day name for error messaging
      return dayOfWeek;
    }
    
    return dayOfWeek;
  };
  
  // Generate time slots based on working hours for the selected date
  // and respect the time buffer between bookings
  const getTimeSlots = () => {
    const dayOfWeek = getDayOfWeek(formData.date);
    if (!dayOfWeek) return [];
    
    // Find working hours for the selected day
    const dayHours = workingHours.find(h => h.dayOfWeek === dayOfWeek);
    
    // If no working hours found or it's not a working day, return empty array
    if (!dayHours || !dayHours.isWorkingDay) return [];
    
    // If daily booking limit is reached, return empty array
    if (dailyBookingLimitReached) return [];
    
    const timeSlots = [];
    const [startHour, startMinute] = dayHours.startTime.split(':').map(Number);
    const [endHour, endMinute] = dayHours.endTime.split(':').map(Number);
    
    // Convert to minutes for easier calculation
    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;
    
    // Get current time in minutes if booking is for today
    let currentTimeInMinutes = 0;
    const today = new Date();
    const selectedDate = new Date(formData.date);
    
    // If booking is for today, we need to check if time slots are in the future
    if (selectedDate.toDateString() === today.toDateString()) {
      const currentHour = today.getHours();
      const currentMinute = today.getMinutes();
      currentTimeInMinutes = currentHour * 60 + currentMinute;
    }
    
    // Get booked time slots for the selected date
    const bookedTimeSlots = existingBookings.map(booking => {
      const [hours, minutes] = booking.time.split(':').map(Number);
      return hours * 60 + minutes; // Convert to minutes
    });
    
    // Generate slots in 30-minute intervals
    for (let minutes = startTimeInMinutes; minutes < endTimeInMinutes; minutes += 30) {
      // Skip time slots in the past if booking is for today
      if (selectedDate.toDateString() === today.toDateString() && minutes <= currentTimeInMinutes) {
        continue;
      }
      
      // Check if this time slot is available based on the time buffer
      const isAvailable = bookedTimeSlots.every(bookedTime => {
        // Calculate the difference in minutes
        const timeDiff = Math.abs(minutes - bookedTime);
        // Return true if the difference is greater than or equal to the buffer
        return timeDiff >= bookingSettings.timeBufferMinutes;
      });
      
      // Only add available time slots
      if (isAvailable) {
        const hour = Math.floor(minutes / 60);
        const minute = minutes % 60;
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        timeSlots.push(`${formattedHour}:${formattedMinute}`);
      }
    }
    
    return timeSlots;
  };
  
  const timeSlots = getTimeSlots();

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
                  className={`w-full px-3 py-2 border ${dateError ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                />
                {dateError && (
                  <p className="mt-1 text-sm text-red-600">{dateError}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                {loadingWorkingHours ? (
                  <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
                ) : timeSlots.length > 0 ? (
                  <select
                    id="time"
                    name="time"
                    required
                    value={formData.time}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div>
                    <select
                      id="time"
                      name="time"
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500"
                    >
                      <option>No available times</option>
                    </select>
                    {formData.date && (
                      <p className="mt-1 text-sm text-red-600">No available times on this date. Please select another date.</p>
                    )}
                  </div>
                )}
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