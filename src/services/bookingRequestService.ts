/**
 * Booking Request Management Service
 * Handles CRUD operations for booking requests in the admin panel
 */

import { getApiUrl } from '../utils/apiConfig';
import { fetchWithAuth } from '../utils/apiUtils';

export interface BookingRequest {
  _id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  serviceId: string;
  serviceName: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestDate: string;
  scheduledDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateRequestData {
  status?: 'pending' | 'approved' | 'rejected' | 'completed';
  scheduledDate?: string;
  notes?: string;
}

class BookingRequestService {
  private readonly API_URL = '/api/bookings/admin/all';
  private getFullApiUrl = (endpoint: string = this.API_URL) => getApiUrl(endpoint);

  /**
   * Get all booking requests
   * @returns Promise with array of booking requests
   */
  async getRequests(): Promise<BookingRequest[]> {
    try {
      const response = await fetchWithAuth(this.getFullApiUrl());
      
      if (!response.ok) {
        throw new Error(`Error fetching booking requests: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching booking requests:', error);
      throw error;
    }
  }

  /**
   * Get a single booking request by ID
   * @param id Booking request ID
   * @returns Promise with booking request details
   */
  async getRequestById(id: string): Promise<BookingRequest | null> {
    try {
      const response = await fetchWithAuth(this.getFullApiUrl(`${this.API_URL}/${id}`));
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Error fetching booking request: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error(`Error fetching booking request with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update a booking request
   * @param id Booking request ID
   * @param updateData Data to update
   * @returns Promise with updated booking request
   */
  async updateRequest(id: string, updateData: UpdateRequestData): Promise<BookingRequest> {
    try {
      const response = await fetchWithAuth(this.getFullApiUrl(`${this.API_URL}/${id}`), {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        throw new Error(`Error updating booking request: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error(`Error updating booking request with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a booking request
   * @param id Booking request ID
   * @returns Promise with success status
   */
  async deleteRequest(id: string): Promise<void> {
    try {
      const response = await fetchWithAuth(this.getFullApiUrl(`${this.API_URL}/${id}`), {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Error deleting booking request: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error deleting booking request with ID ${id}:`, error);
      throw error;
    }
  }
}

export default new BookingRequestService();