import React, { useState, useEffect } from 'react';
import { toast } from '../../utils/toastUtils';
import { format } from 'date-fns';
import settingsService, { OffDutyPeriod, WorkingHours, BookingSettings } from '../../services/settingsService';

// OffDutyPeriod interface is now imported from settingsService

const SettingsManagement: React.FC = () => {
  // Off-duty periods state
  const [offDutyPeriods, setOffDutyPeriods] = useState<OffDutyPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Working hours state
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);
  const [loadingWorkingHours, setLoadingWorkingHours] = useState(false);
  const [submittingWorkingHours, setSubmittingWorkingHours] = useState(false);
  const [editingWorkingHoursId, setEditingWorkingHoursId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<WorkingHours['dayOfWeek']>('monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [isWorkingDay, setIsWorkingDay] = useState(true);
  
  // Booking settings state
  const [bookingSettings, setBookingSettings] = useState<BookingSettings>({
    maxBookingsPerDay: 10,
    timeBufferMinutes: 60
  });
  const [loadingBookingSettings, setLoadingBookingSettings] = useState(false);
  const [submittingBookingSettings, setSubmittingBookingSettings] = useState(false);

  // Fetch existing off-duty periods
  const fetchOffDutyPeriods = async () => {
    setIsLoading(true);
    try {
      const periods = await settingsService.getOffDutyPeriods();
      setOffDutyPeriods(periods);
    } catch (error) {
      console.error('Error fetching off-duty periods:', error);
      toast.error('Failed to load off-duty periods');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOffDutyPeriods();
    fetchWorkingHours();
    fetchBookingSettings();
  }, []);
  
  // Fetch booking settings
  const fetchBookingSettings = async () => {
    setLoadingBookingSettings(true);
    try {
      const settings = await settingsService.getBookingSettings();
      setBookingSettings(settings);
    } catch (error) {
      console.error('Error fetching booking settings:', error);
      toast.error('Failed to load booking settings');
    } finally {
      setLoadingBookingSettings(false);
    }
  };
  
  // Fetch existing working hours
  const fetchWorkingHours = async () => {
    setLoadingWorkingHours(true);
    try {
      const hours = await settingsService.getWorkingHours();
      setWorkingHours(hours);
    } catch (error) {
      console.error('Error fetching working hours:', error);
      toast.error('Failed to load working hours');
    } finally {
      setLoadingWorkingHours(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate || !reason) {
      toast.error('Please fill all fields');
      return;
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      toast.error('End date must be after start date');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const offDutyData = {
        startDate,
        endDate,
        reason
      };

      if (editingId) {
        // Update existing period
        await settingsService.updateOffDutyPeriod(editingId, offDutyData);
        toast.success('Off-duty period updated successfully');
      } else {
        // Create new period
        await settingsService.createOffDutyPeriod(offDutyData);
        toast.success('Off-duty period added successfully');
      }
      
      // Reset form and refresh data
      setStartDate('');
      setEndDate('');
      setReason('');
      setEditingId(null);
      fetchOffDutyPeriods();
    } catch (error) {
      console.error('Error saving off-duty period:', error);
      toast.error('Failed to save off-duty period');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (period: OffDutyPeriod) => {
    setStartDate(period.startDate.split('T')[0]);
    setEndDate(period.endDate.split('T')[0]);
    setReason(period.reason);
    setEditingId(period._id || null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this off-duty period?')) {
      return;
    }

    try {
      await settingsService.deleteOffDutyPeriod(id);
      toast.success('Off-duty period deleted successfully');
      fetchOffDutyPeriods();
    } catch (error) {
      console.error('Error deleting off-duty period:', error);
      toast.error('Failed to delete off-duty period');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  // Handle working hours form submission
  const handleWorkingHoursSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDay || !startTime || !endTime) {
      toast.error('Please fill all fields');
      return;
    }

    // Validate times
    if (startTime >= endTime) {
      toast.error('End time must be after start time');
      return;
    }

    setSubmittingWorkingHours(true);
    
    try {
      const workingHoursData = {
        dayOfWeek: selectedDay,
        startTime,
        endTime,
        isWorkingDay
      };

      if (editingWorkingHoursId) {
        // Update existing working hours
        await settingsService.updateWorkingHours(editingWorkingHoursId, workingHoursData);
        toast.success('Working hours updated successfully');
      } else {
        // Create new working hours
        await settingsService.createWorkingHours(workingHoursData);
        toast.success('Working hours added successfully');
      }
      
      // Reset form and refresh data
      resetWorkingHoursForm();
      fetchWorkingHours();
    } catch (error) {
      console.error('Error saving working hours:', error);
      toast.error('Failed to save working hours');
    } finally {
      setSubmittingWorkingHours(false);
    }
  };

  const resetWorkingHoursForm = () => {
    setSelectedDay('monday');
    setStartTime('09:00');
    setEndTime('17:00');
    setIsWorkingDay(true);
    setEditingWorkingHoursId(null);
  };

  const handleEditWorkingHours = (hours: WorkingHours) => {
    setSelectedDay(hours.dayOfWeek);
    setStartTime(hours.startTime);
    setEndTime(hours.endTime);
    setIsWorkingDay(hours.isWorkingDay);
    setEditingWorkingHoursId(hours._id || null);
  };

  const handleDeleteWorkingHours = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete these working hours?')) {
      return;
    }

    try {
      await settingsService.deleteWorkingHours(id);
      toast.success('Working hours deleted successfully');
      fetchWorkingHours();
    } catch (error) {
      console.error('Error deleting working hours:', error);
      toast.error('Failed to delete working hours');
    }
  };

  const formatTime = (timeString: string) => {
    try {
      // Convert 24-hour format to 12-hour format
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch (error) {
      return timeString;
    }
  };

  const getDayName = (day: string) => {
    const days: Record<string, string> = {
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday'
    };
    return days[day] || day;
  };
  
  // Handle bulk update of working hours (e.g., set Mon-Fri 9-5)
  const handleBulkUpdateWorkingHours = async () => {
    if (!window.confirm('This will set standard working hours (9:00 AM - 5:00 PM) for Monday to Friday, and mark weekends as non-working days. Continue?')) {
      return;
    }
    
    setSubmittingWorkingHours(true);
    
    try {
      const weekdays: WorkingHours['dayOfWeek'][] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
      const weekends: WorkingHours['dayOfWeek'][] = ['saturday', 'sunday'];
      
      const bulkData: Omit<WorkingHours, '_id' | 'createdAt' | 'updatedAt'>[] = [
        ...weekdays.map(day => ({
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '17:00',
          isWorkingDay: true
        })),
        ...weekends.map(day => ({
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '17:00',
          isWorkingDay: false
        }))
      ];
      
      await settingsService.updateAllWorkingHours(bulkData);
      toast.success('Working hours updated successfully');
      fetchWorkingHours();
    } catch (error) {
      console.error('Error updating working hours in bulk:', error);
      toast.error('Failed to update working hours');
    } finally {
      setSubmittingWorkingHours(false);
    }
  };

  // Handle booking settings form submission
  const handleBookingSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (bookingSettings.maxBookingsPerDay < 1) {
      toast.error('Maximum bookings per day must be at least 1');
      return;
    }
    
    if (bookingSettings.timeBufferMinutes < 0) {
      toast.error('Time buffer cannot be negative');
      return;
    }
    
    setSubmittingBookingSettings(true);
    
    try {
      await settingsService.updateBookingSettings({
        maxBookingsPerDay: bookingSettings.maxBookingsPerDay,
        timeBufferMinutes: bookingSettings.timeBufferMinutes
      });
      toast.success('Booking settings updated successfully');
      fetchBookingSettings();
    } catch (error) {
      console.error('Error updating booking settings:', error);
      toast.error('Failed to update booking settings');
    } finally {
      setSubmittingBookingSettings(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-6">Settings</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Working Hours</h3>
            <button
              type="button"
              onClick={handleBulkUpdateWorkingHours}
              disabled={submittingWorkingHours}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submittingWorkingHours ? 'Updating...' : 'Set Standard Hours (Mon-Fri 9-5)'}
            </button>
          </div>
          <p className="text-gray-600 mb-4">
            Set your regular working hours for each day of the week. Customers will only be able to book services during these times.
          </p>
        
        <form onSubmit={handleWorkingHoursSubmit} className="bg-gray-50 p-4 rounded-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label htmlFor="dayOfWeek" className="block text-sm font-medium text-gray-700 mb-1">
                Day of Week
              </label>
              <select
                id="dayOfWeek"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value as WorkingHours['dayOfWeek'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="monday">Monday</option>
                <option value="tuesday">Tuesday</option>
                <option value="wednesday">Wednesday</option>
                <option value="thursday">Thursday</option>
                <option value="friday">Friday</option>
                <option value="saturday">Saturday</option>
                <option value="sunday">Sunday</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                id="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                id="endTime"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            
            <div className="flex items-end pb-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={isWorkingDay}
                  onChange={(e) => setIsWorkingDay(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Working Day</span>
              </label>
            </div>
          </div>
          
          <div className="flex justify-end">
            {editingWorkingHoursId && (
              <button
                type="button"
                onClick={resetWorkingHoursForm}
                className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={submittingWorkingHours}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submittingWorkingHours ? 'Saving...' : editingWorkingHoursId ? 'Update Hours' : 'Add Hours'}
            </button>
          </div>
        </form>
        
        {loadingWorkingHours ? (
          <div className="text-center py-4">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading...</p>
          </div>
        ) : workingHours.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Day
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {workingHours.map((hours) => (
                  <tr key={hours._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getDayName(hours.dayOfWeek)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTime(hours.startTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTime(hours.endTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${hours.isWorkingDay ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {hours.isWorkingDay ? 'Working' : 'Off'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditWorkingHours(hours)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => hours._id && handleDeleteWorkingHours(hours._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-4 bg-gray-50 rounded-md">
            <p className="text-gray-500">No working hours set</p>
          </div>
        )}
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-medium mb-4">Off-Duty Periods</h3>
          <p className="text-gray-600 mb-4">
            Set periods when you are unavailable for bookings. Customers will not be able to book services during these times.
          </p>
        
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                Reason
              </label>
              <select
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="">Select a reason</option>
                <option value="Holiday">Holiday</option>
                <option value="Vacation">Vacation</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Personal">Personal</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end">
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setReason('');
                  setEditingId(null);
                }}
                className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : editingId ? 'Update Period' : 'Add Period'}
            </button>
          </div>
        </form>
        
        {isLoading ? (
          <div className="text-center py-4">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading...</p>
          </div>
        ) : offDutyPeriods.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {offDutyPeriods.map((period) => (
                  <tr key={period._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(period.startDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(period.endDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {period.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(period)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => period._id && handleDelete(period._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-4 bg-gray-50 rounded-md">
            <p className="text-gray-500">No off-duty periods set</p>
          </div>
        )}
        </div>
      </div>
      
      {/* Booking Settings Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-medium mb-4">Booking Settings</h3>
          <p className="text-gray-600 mb-4">
            Configure settings for how bookings can be made by customers.
          </p>
        
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <form onSubmit={handleBookingSettingsSubmit} className="space-y-4">
            <div>
              <label htmlFor="maxBookingsPerDay" className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Bookings Per Day
              </label>
              <input
                type="number"
                id="maxBookingsPerDay"
                min="1"
                value={bookingSettings.maxBookingsPerDay}
                onChange={(e) => setBookingSettings(prev => ({
                  ...prev,
                  maxBookingsPerDay: parseInt(e.target.value) || 1
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                The maximum number of bookings that can be made on a single day. Once this limit is reached, customers will need to select a different day.
              </p>
            </div>
            
            <div>
              <label htmlFor="timeBufferMinutes" className="block text-sm font-medium text-gray-700 mb-1">
                Time Buffer Between Bookings (minutes)
              </label>
              <input
                type="number"
                id="timeBufferMinutes"
                min="0"
                step="15"
                value={bookingSettings.timeBufferMinutes}
                onChange={(e) => setBookingSettings(prev => ({
                  ...prev,
                  timeBufferMinutes: parseInt(e.target.value) || 0
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                The minimum time gap between bookings. For example, if set to 60 minutes and a customer books at 1:00 PM, the next available slot will be 2:00 PM.
              </p>
            </div>
            
            <div className="pt-2">
              <button
                type="submit"
                disabled={submittingBookingSettings || loadingBookingSettings}
                className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingBookingSettings ? 'Saving...' : 'Save Booking Settings'}
              </button>
            </div>
          </form>
        </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsManagement;