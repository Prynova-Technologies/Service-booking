/**
 * User Management Service
 * Handles CRUD operations for user management in the admin panel
 */

import { getApiUrl } from '../utils/apiConfig';
import { fetchWithAuth } from '../utils/apiUtils';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  phone?: string;
  createdAt?: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  phone?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  role?: 'admin' | 'user';
  phone?: string;
}

class UserService {
  private readonly API_URL = '/api/users';
  private getFullApiUrl = (endpoint: string = this.API_URL) => getApiUrl(endpoint);

  /**
   * Get all users
   * @returns Promise with array of users
   */
  async getUsers(): Promise<User[]> {
    try {
      const response = await fetchWithAuth(this.getFullApiUrl());
      
      if (!response.ok) {
        throw new Error(`Error fetching users: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Get a single user by ID
   * @param id User ID
   * @returns Promise with user details
   */
  async getUserById(id: string): Promise<User | null> {
    try {
      const response = await fetchWithAuth(this.getFullApiUrl(`${this.API_URL}/${id}`));
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Error fetching user: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error(`Error fetching user with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new user
   * @param userData User data to create
   * @returns Promise with created user
   */
  async createUser(userData: CreateUserData): Promise<User> {
    try {
      const response = await fetchWithAuth(this.getFullApiUrl(), {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        throw new Error(`Error creating user: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update an existing user
   * @param id User ID to update
   * @param userData Updated user data
   * @returns Promise with updated user
   */
  async updateUser(id: string, userData: UpdateUserData): Promise<User> {
    try {
      const response = await fetchWithAuth(this.getFullApiUrl(`${this.API_URL}/${id}`), {
        method: 'PATCH',
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        throw new Error(`Error updating user: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error(`Error updating user with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a user
   * @param id User ID to delete
   * @returns Promise indicating success
   */
  async deleteUser(id: string): Promise<void> {
    try {
      const response = await fetchWithAuth(this.getFullApiUrl(`${this.API_URL}/${id}`), {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Error deleting user: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error deleting user with ID ${id}:`, error);
      throw error;
    }
  }
}

const userService = new UserService();
export default userService;