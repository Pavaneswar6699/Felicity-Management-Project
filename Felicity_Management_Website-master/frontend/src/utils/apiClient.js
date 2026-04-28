/**
 * API client utility for making consistent API requests
 * Handles environment variable-based URL resolution
 */

import API_ENDPOINTS, { getFullApiUrl } from '../config/apiConfig';

/**
 * Make a fetch request to an API endpoint
 * Automatically uses environment variable-based API URL
 * 
 * @param {string} endpoint - The endpoint path or full endpoint object key
 * @param {Object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise<Response>} Fetch response
 */
export const apiCall = async (endpoint, options = {}) => {
  // If endpoint starts with /api, use it directly (fetch interceptor will handle base URL)
  const url = endpoint.startsWith('/api') ? endpoint : getFullApiUrl(endpoint);
  
  return fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
};

/**
 * Make a GET request
 */
export const apiGet = (endpoint, options = {}) => {
  return apiCall(endpoint, {
    method: 'GET',
    ...options,
  });
};

/**
 * Make a POST request
 */
export const apiPost = (endpoint, body, options = {}) => {
  return apiCall(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
    ...options,
  });
};

/**
 * Make a PATCH request
 */
export const apiPatch = (endpoint, body, options = {}) => {
  return apiCall(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(body),
    ...options,
  });
};

/**
 * Make a DELETE request
 */
export const apiDelete = (endpoint, options = {}) => {
  return apiCall(endpoint, {
    method: 'DELETE',
    ...options,
  });
};

/**
 * Make a PUT request
 */
export const apiPut = (endpoint, body, options = {}) => {
  return apiCall(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
    ...options,
  });
};

export default {
  call: apiCall,
  get: apiGet,
  post: apiPost,
  patch: apiPatch,
  delete: apiDelete,
  put: apiPut,
  endpoints: API_ENDPOINTS,
};
