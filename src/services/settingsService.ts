import { getApiUrl } from '../utils/apiConfig';
import { fetchWithAuth } from '../utils/apiUtils';

export interface OffDutyPeriod {
  _id?: string;
  startDate: string;
  endDate: string;
  reason: string;
  createdAt?: string;
}

export interface WorkingHours {
  _id?: string;
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startTime: string; // Format: HH:MM (24-hour format)
  endTime: string; // Format: HH:MM (24-hour format)
  isWorkingDay: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BookingSettings {
  _id?: string;
  maxBookingsPerDay: number;
  timeBufferMinutes: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Fetch all off-duty periods
 */
const getOffDutyPeriods = async (): Promise<OffDutyPeriod[]> => {
  try {
    const response = await fetchWithAuth(getApiUrl('/api/settings/off-duty'));
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching off-duty periods:', error);
    throw error;
  }
};

/**
 * Create a new off-duty period
 */
const createOffDutyPeriod = async (offDutyData: Omit<OffDutyPeriod, '_id' | 'createdAt'>): Promise<OffDutyPeriod> => {
  try {
    const response = await fetchWithAuth(getApiUrl('/api/settings/off-duty'), {
      method: 'POST',
      body: JSON.stringify(offDutyData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating off-duty period:', error);
    throw error;
  }
};

/**
 * Update an existing off-duty period
 */
const updateOffDutyPeriod = async (id: string, offDutyData: Omit<OffDutyPeriod, '_id' | 'createdAt'>): Promise<OffDutyPeriod> => {
  try {
    const response = await fetchWithAuth(getApiUrl(`/api/settings/off-duty/${id}`), {
      method: 'PUT',
      body: JSON.stringify(offDutyData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating off-duty period:', error);
    throw error;
  }
};

/**
 * Delete an off-duty period
 */
const deleteOffDutyPeriod = async (id: string): Promise<void> => {
  try {
    const response = await fetchWithAuth(getApiUrl(`/api/settings/off-duty/${id}`), {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting off-duty period:', error);
    throw error;
  }
};

/**
 * Fetch all working hours settings
 */
const getWorkingHours = async (): Promise<WorkingHours[]> => {
  try {
    const response = await fetchWithAuth(getApiUrl('/api/settings/working-hours'));
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching working hours:', error);
    throw error;
  }
};

/**
 * Create a new working hours setting
 */
const createWorkingHours = async (workingHoursData: Omit<WorkingHours, '_id' | 'createdAt' | 'updatedAt'>): Promise<WorkingHours> => {
  try {
    const response = await fetchWithAuth(getApiUrl('/api/settings/working-hours'), {
      method: 'POST',
      body: JSON.stringify(workingHoursData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating working hours:', error);
    throw error;
  }
};

/**
 * Update an existing working hours setting
 */
const updateWorkingHours = async (id: string, workingHoursData: Omit<WorkingHours, '_id' | 'createdAt' | 'updatedAt'>): Promise<WorkingHours> => {
  try {
    const response = await fetchWithAuth(getApiUrl(`/api/settings/working-hours/${id}`), {
      method: 'PUT',
      body: JSON.stringify(workingHoursData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating working hours:', error);
    throw error;
  }
};

/**
 * Delete a working hours setting
 */
const deleteWorkingHours = async (id: string): Promise<void> => {
  try {
    const response = await fetchWithAuth(getApiUrl(`/api/settings/working-hours/${id}`), {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting working hours:', error);
    throw error;
  }
};

/**
 * Update all working hours settings in bulk
 */
const updateAllWorkingHours = async (workingHoursData: Omit<WorkingHours, '_id' | 'createdAt' | 'updatedAt'>[]): Promise<WorkingHours[]> => {
  try {
    const response = await fetchWithAuth(getApiUrl('/api/settings/working-hours/bulk'), {
      method: 'PUT',
      body: JSON.stringify(workingHoursData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating all working hours:', error);
    throw error;
  }
};

/**
 * Fetch booking settings
 */
const getBookingSettings = async (): Promise<BookingSettings> => {
  try {
    const response = await fetchWithAuth(getApiUrl('/api/settings/booking'));
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching booking settings:', error);
    throw error;
  }
};

/**
 * Update booking settings
 */
const updateBookingSettings = async (settingsData: Omit<BookingSettings, '_id' | 'createdAt' | 'updatedAt'>): Promise<BookingSettings> => {
  try {
    const response = await fetchWithAuth(getApiUrl('/api/settings/booking'), {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating booking settings:', error);
    throw error;
  }
};

const settingsService = {
  // Off-duty periods
  getOffDutyPeriods,
  createOffDutyPeriod,
  updateOffDutyPeriod,
  deleteOffDutyPeriod,
  
  // Working hours
  getWorkingHours,
  createWorkingHours,
  updateWorkingHours,
  deleteWorkingHours,
  updateAllWorkingHours,
  
  // Booking settings
  getBookingSettings,
  updateBookingSettings,
};

export default settingsService;