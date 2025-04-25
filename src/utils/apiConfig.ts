/**
 * API Configuration
 * Re-exports API URL utility functions from the environment configuration
 */

import { getApiUrl } from '../config/env';

/**
 * Returns the full API URL by combining the base API URL with the endpoint
 * @param endpoint - API endpoint path
 * @returns Full API URL
 */
export { getApiUrl };