/**
 * Customer Management Service
 * Handles operations for customers in the admin panel
 */

import { getApiUrl } from '../config/env';
import { fetchWithAuth } from '../utils/apiUtils';

export interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'user';
  bookings: number;
  createdAt?: string;
  updatedAt?: string;
}

class CustomerService {
  private readonly API_URL = '/api/users';
  private getFullApiUrl = (endpoint: string = this.API_URL) => getApiUrl(endpoint);

  /**
   * Get all customers
   * @returns Promise with array of customers
   */
  async getCustomers(): Promise<Customer[]> {
    try {
      const response = await fetchWithAuth(this.getFullApiUrl());
      
      if (!response.ok) {
        throw new Error(`Error fetching customers: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  }

  /**
   * Get a single customer by ID
   * @param id Customer ID
   * @returns Promise with customer details
   */
  async getCustomerById(id: string): Promise<Customer | null> {
    try {
      const response = await fetchWithAuth(this.getFullApiUrl(`${this.API_URL}/${id}`));
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Error fetching customer: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error(`Error fetching customer with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get customer booking history
   * @param id Customer ID
   * @returns Promise with customer's booking history
   */
  async getCustomerBookings(id: string): Promise<any[]> {
    try {
      const response = await fetchWithAuth(this.getFullApiUrl(`${this.API_URL}/customer/${id}`));
      
      if (!response.ok) {
        throw new Error(`Error fetching customer bookings: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error(`Error fetching bookings for customer ID ${id}:`, error);
      throw error;
    }
  }
}

const customerService = new CustomerService();
export default customerService;