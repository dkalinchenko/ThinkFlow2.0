/**
 * API Configuration
 * 
 * This file handles the configuration for API endpoints, ensuring that
 * the application can work in both development and production environments.
 */

// Get the API URL from environment variables or use default local development URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Remove trailing slash if present
const normalizedApiUrl = API_URL.endsWith('/') 
  ? API_URL.slice(0, -1) 
  : API_URL;

/**
 * Configuration object for API endpoints
 */
const apiConfig = {
  baseUrl: normalizedApiUrl,
  
  // Authentication endpoints
  auth: {
    login: `${normalizedApiUrl}/api/auth/login`,
    register: `${normalizedApiUrl}/api/auth/register`,
    refresh: `${normalizedApiUrl}/api/auth/refresh`,
  },
  
  // User endpoints
  users: {
    profile: `${normalizedApiUrl}/api/users/profile`,
    update: `${normalizedApiUrl}/api/users/update`,
  },
  
  // Decision endpoints
  decisions: {
    base: `${normalizedApiUrl}/api/decisions`,
    byId: (id) => `${normalizedApiUrl}/api/decisions/${id}`,
    criteria: (id) => `${normalizedApiUrl}/api/decisions/${id}/criteria`,
    alternatives: (id) => `${normalizedApiUrl}/api/decisions/${id}/alternatives`,
    scores: (id) => `${normalizedApiUrl}/api/decisions/${id}/scores`,
    invitations: (id) => `${normalizedApiUrl}/api/decisions/${id}/invitations`,
  },
};

export default apiConfig; 