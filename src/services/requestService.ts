/**
 * Service Request Management Service
 * Handles operations for service requests/bookings in the admin panel
 */

import { getApiUrl } from '../config/env';
import { fetchWithAuth } from '../utils/apiUtils';

export interface ServiceRequest {
  id: string;
  service: {
    id: string;
    name: string;
  };
  customer: {
    id: string;
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
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

class RequestService {
  private readonly API_ADM_URL = '/api/bookings/admin/all';
  private readonly API_URL = '/api/bookings';
  private getFullApiUrl = (endpoint: string = this.API_URL) => getApiUrl(endpoint);

  /**
   * Get all service requests/bookings
   * @param filters Optional filters for the requests
   * @returns Promise with array of service requests
   */
  async getRequests(filters?: {
    serviceId?: string;
    status?: string;
    date?: string;
    customerId?: string;
  }): Promise<ServiceRequest[]> {
    try {
      // Build URL with filters if provided
      let url = this.API_ADM_URL;
      if (filters) {
        const queryParams = new URLSearchParams();
        if (filters.serviceId) queryParams.append('serviceId', filters.serviceId);
        if (filters.status) queryParams.append('status', filters.status);
        if (filters.date) queryParams.append('date', filters.date);
        if (filters.customerId) queryParams.append('customerId', filters.customerId);
        
        const queryString = queryParams.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
      }
      
      // Make API call to backend
      const response = await fetchWithAuth(this.getFullApiUrl(url));
      
      // Check if response is ok
      if (!response.ok) {
        throw new Error(`Error fetching service requests: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching service requests:', error);
      throw error;
    }
  }

  /**
   * Get a single service request by ID
   * @param id Request ID
   * @returns Promise with request details
   */
  async getRequestById(id: string): Promise<ServiceRequest | null> {
    try {
      const response = await fetchWithAuth(this.getFullApiUrl(`${this.API_URL}/${id}`));
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Error fetching service request: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error(`Error fetching service request with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update a service request status
   * @param id Request ID
   * @param status New status
   * @param cancellationReason Optional reason for cancellation (for cancelled status)
   * @param completedPrice Optional completed price (for completed status)
   * @param servicePersonnelName Optional service personnel name (for completed status)
   * @returns Promise with updated request
   */
  async updateRequestStatus(id: string, status: ServiceRequest['status'], cancellationReason?: string, completedPrice?: number, servicePersonnelName?: string): Promise<ServiceRequest> {
    try {
      const updateData: { status: string; completedPrice?: number; cancellationReason?: string; servicePersonnelName?: string } = { status };
      
      // If status is completed and completedPrice is provided, include it
      if (status === 'completed' && completedPrice) {
        updateData.completedPrice = completedPrice;
      }
      
      // If status is completed and servicePersonnelName is provided, include it
      if (status === 'completed' && servicePersonnelName) {
        updateData.servicePersonnelName = servicePersonnelName;
      }
      
      // If status is cancelled and cancellationReason is provided, include it
      if (status === 'cancelled' && cancellationReason) {
        updateData.cancellationReason = cancellationReason;
      }
      
      const response = await fetchWithAuth(this.getFullApiUrl(`${this.API_URL}/${id}/status`), {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        throw new Error(`Error updating service request status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error(`Error updating service request status for ID ${id}:`, error);
      throw error;
    }
  }
}

const requestService = new RequestService();
export default requestService;