/**
 * API utilities for handling authentication and requests
 */

import authService from '../services/authService';

/**
 * Creates fetch request headers with authentication token
 * @param additionalHeaders - Optional additional headers to include
 * @returns Headers object with authentication and content-type headers
 */
export const createAuthHeaders = (additionalHeaders: Record<string, string> = {}): HeadersInit => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...additionalHeaders
  };

  // Add auth token if available
  const token = authService.getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Creates a fetch request with authentication
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns Promise with fetch response
 */
export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const headers = createAuthHeaders(options.headers as Record<string, string>);
  
  const requestOptions: RequestInit = {
    ...options,
    headers
  };
  
  const response = await fetch(url, requestOptions);
  
  // Handle 401 Unauthorized responses
  if (response.status === 401) {
    // Token might be expired or invalid
    authService.logout();
    window.location.href = '/login';
  }
  
  return response;
};