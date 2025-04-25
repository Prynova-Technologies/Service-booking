import { Service } from '../components/ServiceCard';
import { getApiUrl } from '../config/env';

class ServiceService {
  private apiUrl = '/api/services';
  private getFullApiUrl = (endpoint: string = this.apiUrl) => getApiUrl(endpoint);
  
  
  /**
   * Fetch all services
   * @param searchQuery Optional search query to filter services
   * @returns Promise with array of services
   */
  async getServices(searchQuery?: string): Promise<Service[]> {
    try {
      // Build URL with search query if provided
      let url = this.apiUrl;
      if (searchQuery) {
        url += `?search=${encodeURIComponent(searchQuery)}`;
      }
      
      // Make API call to backend
      const response = await fetch(this.getFullApiUrl(url));
      
      // Check if response is ok
      if (!response.ok) {
        throw new Error(`Error fetching services: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Return the data array from the response
      return data.data;
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  }
  
  /**
   * Get popular services (subset of all services)
   * @param limit Number of services to return
   * @returns Promise with array of popular services
   */
  async getPopularServices(limit: number = 3): Promise<Service[]> {
    try {
      const services = await this.getServices();
      return services.slice(0, limit);
    } catch (error) {
      console.error('Error fetching popular services:', error);
      throw error;
    }
  }
  
  /**
   * Get a single service by ID
   * @param id Service ID
   * @returns Promise with service details
   */
  async getServiceById(id: string): Promise<Service | null> {
    try {
      // Make API call to specific endpoint
      const response = await fetch(this.getFullApiUrl(`${this.apiUrl}/${id}`));
      
      // Check if response is ok
      if (!response.ok) {
        // If service not found (404), return null
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
}

const serviceService = new ServiceService();
export default serviceService;