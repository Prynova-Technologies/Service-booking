/**
 * Booking Service
 * Handles all booking-related operations
 */

// Define the Booking interface
export interface Booking {
  _id: string;
  service: {
    _id: string;
    name: string;
    price: string;
    iconName?: string;
  };
  user: {
    _id: string;
    name: string;
    email: string;
  };
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  startingPrice: number;
  completedPrice?: number;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

import { getApiUrl } from '../config/env';
import { fetchWithAuth } from '../utils/apiUtils';

class BookingService {
  private apiUrl = '/api/bookings';
  private getFullApiUrl = (endpoint: string = this.apiUrl) => getApiUrl(endpoint);

  /**
   * Get all bookings for the current user
   * @returns Promise with array of bookings
   */
  async getBookings(): Promise<Booking[]> {
    try {
      const response = await fetchWithAuth(this.getFullApiUrl());
      
      if (!response.ok) {
        throw new Error(`Error fetching bookings: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  }

  /**
   * Get a single booking by ID
   * @param id Booking ID
   * @returns Promise with booking details
   */
  async getBookingById(id: string): Promise<Booking | null> {
    try {
      const response = await fetchWithAuth(this.getFullApiUrl(`${this.apiUrl}/${id}`));
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Error fetching booking: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error(`Error fetching booking with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new booking
   * @param bookingData Booking data to create
   * @returns Promise with created booking
   */
  async createBooking(bookingData: {
    serviceId: string;
    date: string;
    time: string;
    address?: string;
    notes?: string;
  }): Promise<Booking> {
    try {
      const response = await fetchWithAuth(this.getFullApiUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error creating booking: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  /**
   * Cancel a booking
   * @param id Booking ID to cancel
   * @returns Promise with updated booking
   */
  async cancelBooking(id: string): Promise<Booking> {
    try {
      const response = await fetchWithAuth(this.getFullApiUrl(`${this.apiUrl}/${id}/cancel`), {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error cancelling booking: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error(`Error cancelling booking with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all bookings for a specific customer (admin only)
   * @param customerId Customer ID to fetch bookings for
   * @param filters Optional filters for status, serviceId, or date
   * @returns Promise with array of customer bookings
   */
  async getCustomerBookings(
    customerId: string,
    filters?: { status?: string; serviceId?: string; date?: string }
  ): Promise<Booking[]> {
    try {
      let url = this.getFullApiUrl(`${this.apiUrl}/customer/${customerId}`);
      
      // Add query parameters if filters are provided
      if (filters) {
        const queryParams = new URLSearchParams();
        if (filters.status) queryParams.append('status', filters.status);
        if (filters.serviceId) queryParams.append('serviceId', filters.serviceId);
        if (filters.date) queryParams.append('date', filters.date);
        
        const queryString = queryParams.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
      }
      
      // Use fetchWithAuth instead of fetch to include authentication token
      const response = await fetchWithAuth(url);
      
      if (!response.ok) {
        throw new Error(`Error fetching customer bookings: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error(`Error fetching bookings for customer ${customerId}:`, error);
      throw error;
    }
  }
}

const bookingService = new BookingService();
export default bookingService;