/**
 * Environment Configuration
 * Centralized configuration for environment-specific variables
 */

// API configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Get the complete API URL by combining the base URL with the endpoint
 * @param endpoint API endpoint path
 * @returns Complete API URL
 */
export const getApiUrl = (endpoint: string): string => {
  // If API_BASE_URL is set, use it; otherwise use the relative path
  if (API_BASE_URL) {
    // Ensure we don't have double slashes when combining
    const baseWithoutTrailingSlash = API_BASE_URL.endsWith('/') 
      ? API_BASE_URL.slice(0, -1) 
      : API_BASE_URL;
    
    const endpointWithoutLeadingSlash = endpoint.startsWith('/') 
      ? endpoint.slice(1) 
      : endpoint;
    
    return `${baseWithoutTrailingSlash}/${endpointWithoutLeadingSlash}`;
  }
};