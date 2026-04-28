/**
 * Centralized API endpoint configuration
 * All API base URLs are derived from VITE_API_URL environment variable
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  // Admin endpoints (/api/adminLogin)
  ADMIN: {
    LOGIN: '/api/adminLogin/login',
    GET_ORGANIZERS: '/api/adminLogin/organizers',
    GET_ORGANIZER: (organizerId) => `/api/adminLogin/organizers/${organizerId}`,
    CREATE_ORGANIZER: '/api/adminLogin/organizers',
    DELETE_ORGANIZER: (organizerId) => `/api/adminLogin/organizers/${organizerId}`,
    DISABLE_ORGANIZER: (organizerId) => `/api/adminLogin/organizers/${organizerId}/disable`,
    ENABLE_ORGANIZER: (organizerId) => `/api/adminLogin/organizers/${organizerId}/enable`,
    GET_PASSWORD_CHANGE_REQUESTS: '/api/adminLogin/password-change-requests',
    APPROVE_PASSWORD_CHANGE: (requestId) => `/api/adminLogin/password-change-requests/${requestId}/approve`,
    REJECT_PASSWORD_CHANGE: (requestId) => `/api/adminLogin/password-change-requests/${requestId}/reject`,
    GET_ORGANIZER_PASSWORD_HISTORY: (organizerId) => `/api/adminLogin/organizers/${organizerId}/password-history`,
  },

  // Organizer endpoints (/api/organizerLogin)
  ORGANIZER: {
    LOGIN: '/api/organizerLogin/login',
    GET_PROFILE: '/api/organizerLogin/profile',
    UPDATE_PROFILE: '/api/organizerLogin/profile',
    REQUEST_PASSWORD_CHANGE: '/api/organizerLogin/request-password-change',
    GET_PASSWORD_CHANGE_REQUESTS: '/api/organizerLogin/password-change-requests',
  },

  // Organizer Events endpoints (/api/organizerEvents)
  ORGANIZER_EVENTS: {
    GET_ALL: '/api/organizerEvents',
    GET_BY_ID: (eventId) => `/api/organizerEvents/${eventId}`,
    CREATE: '/api/organizerEvents',
    UPDATE: (eventId) => `/api/organizerEvents/${eventId}`,
    DELETE: (eventId) => `/api/organizerEvents/${eventId}`,
    PUBLISH: (eventId) => `/api/organizerEvents/${eventId}/publish`,
    GET_ANALYTICS: (eventId) => `/api/organizerEvents/${eventId}/analytics`,
    GET_REGISTRATIONS: (eventId) => `/api/organizerEvents/${eventId}/registrations`,
    GET_FORM_RESPONSES: (eventId) => `/api/organizerEvents/${eventId}/responses`,
    SCAN_TICKET: (eventId) => `/api/organizerEvents/${eventId}/scan`,
    EXPORT_DATA: (eventId) => `/api/organizerEvents/${eventId}/export`,
    ACCEPT_REGISTRATION: (registrationId) => `/api/organizerEvents/registrations/${registrationId}/accept`,
    REJECT_REGISTRATION: (registrationId) => `/api/organizerEvents/registrations/${registrationId}/reject`,
    MARK_ATTENDANCE: (registrationId) => `/api/organizerEvents/registrations/${registrationId}/attend`,
    GET_FORUM_MESSAGES: (eventId) => `/api/organizerEvents/${eventId}/forum/messages`,
    POST_FORUM_MESSAGE: (eventId) => `/api/organizerEvents/${eventId}/forum/messages`,
    TOGGLE_FORUM_REACTION: (messageId) => `/api/organizerEvents/forum/messages/${messageId}/reactions`,
    PIN_FORUM_MESSAGE: (eventId, messageId) => `/api/organizerEvents/${eventId}/forum/messages/${messageId}/pin`,
    DELETE_FORUM_MESSAGE: (eventId, messageId) => `/api/organizerEvents/${eventId}/forum/messages/${messageId}`,
  },

  // Participant endpoints (/api/participant)
  PARTICIPANT: {
    LOGIN: '/api/participant/login',
    REGISTER: '/api/participant/register',
    GET_EVENTS: '/api/participant/events',
    GET_ORGANIZERS: '/api/participant/organizers',
    GET_ORGANIZER: (organizerId) => `/api/participant/organizer/${organizerId}`,
    GET_PROFILE: '/api/participant/profile',
    UPDATE_PROFILE: '/api/participant/profile',
    CHANGE_PASSWORD: '/api/participant/change-password',
    REGISTER_EVENT: (eventId) => `/api/participant/register/${eventId}`,
    GET_MY_REGISTRATIONS: '/api/participant/my-registrations',
    DELETE_REGISTRATION: (registrationId) => `/api/participant/registrations/${registrationId}`,
    GET_EVENT_CALENDAR: (eventId) => `/api/participant/events/${eventId}/calendar`,
    GET_FORUM_MESSAGES: (eventId) => `/api/participant/events/${eventId}/forum/messages`,
    POST_FORUM_MESSAGE: (eventId) => `/api/participant/events/${eventId}/forum/messages`,
    TOGGLE_FORUM_REACTION: (messageId) => `/api/participant/forum/messages/${messageId}/reactions`,
  },
};

/**
 * Get the full URL for an API endpoint (with base URL)
 * @param {string} endpoint - The endpoint path
 * @returns {string} Full URL with base URL
 */
export const getFullApiUrl = (endpoint) => `${API_BASE_URL}${endpoint}`;

/**
 * Get API base URL
 * @returns {string} API base URL
 */
export const getApiBaseUrl = () => API_BASE_URL;

export default API_ENDPOINTS;
