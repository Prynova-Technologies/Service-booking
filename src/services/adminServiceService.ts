/**
 * Admin Service Management Service
 * Handles CRUD operations for services in the admin panel
 */

import { getApiUrl } from '../config/env';
import { fetchWithAuth } from '../utils/apiUtils';

export interface AdminService {
  _id: string;
  name: string;
  description: string;
  price: number;
  iconName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateServiceData {
  name: string;
  description: string;
  startingPrice: number;
  iconName?: string;
}

export interface UpdateServiceData {
  name?: string;
  description?: string;
  startingPrice?: number;
  iconName?: string;
}

class AdminServiceService {
  private readonly API_URL = '/api/services';
  private getFullApiUrl = (endpoint: string = this.API_URL) => getApiUrl(endpoint);

  /**
   * Get all services
   * @returns Promise with array of services
   */
  async getServices(): Promise<AdminService[]> {
    try {
      const response = await fetchWithAuth(this.getFullApiUrl());
      
      if (!response.ok) {
        throw new Error(`Error fetching services: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  }

  /**
   * Get a single service by ID
   * @param id Service ID
   * @returns Promise with service details
   */
  async getServiceById(id: string): Promise<AdminService | null> {
    try {
      const response = await fetchWithAuth(this.getFullApiUrl(`${this.API_URL}/${id}`));
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Error fetching service: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error(`Error fetching service with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new service
   * @param serviceData Service data to create
   * @returns Promise with created service
   */
  async createService(serviceData: CreateServiceData): Promise<AdminService> {
    try {
      const response = await fetchWithAuth(this.getFullApiUrl(), {
        method: 'POST',
        body: JSON.stringify(serviceData),
      });
      
      if (!response.ok) {
        throw new Error(`Error creating service: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  }

  /**
   * Update an existing service
   * @param id Service ID
   * @param serviceData Service data to update
   * @returns Promise with updated service
   */
  async updateService(id: string, serviceData: UpdateServiceData): Promise<AdminService> {
    try {
      const response = await fetchWithAuth(this.getFullApiUrl(`${this.API_URL}/${id}`), {
        method: 'PATCH',
        body: JSON.stringify(serviceData),
      });
      
      if (!response.ok) {
        throw new Error(`Error updating service: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error(`Error updating service with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a service
   * @param id Service ID
   * @returns Promise with success status
   */
  async deleteService(id: string): Promise<void> {
    try {
      const response = await fetchWithAuth(this.getFullApiUrl(`${this.API_URL}/${id}`), {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Error deleting service: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error deleting service with ID ${id}:`, error);
      throw error;
    }
  }
}

const adminServiceService = new AdminServiceService();
export default adminServiceService;