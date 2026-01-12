/**
 * API Configuration
 * Centralized configuration for API endpoints
 */

// Base URL for the API - change this for different environments
export const API_BASE_URL = "http://10.173.217.160:8000/api/";

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    REQUEST_TOKEN: "auth/request-token/",
    VERIFY_TOKEN: "auth/verify-token/",
  },
  // User
  PROFILE: "profile/",
  // Agents
  AGENTS: {
    BASE: "agents/",
    BY_ID: (id: number) => `agents/${id}/`,
    CALL_TRAFFIC: (id: number) => `agents/${id}/call-traffic/`,
    LINK_PHONE: (id: number) => `agents/${id}/link-phone-number/`,
    UNLINK_PHONE: (id: number) => `agents/${id}/unlink-phone-number/`,
  },
  // Calls
  CALLS: {
    BASE: "calls/",
    BY_ID: (id: string) => `calls/${id}/`,
    CREATE_PHONE: "calls/create-phone-call/",
    CREATE_WEB: "calls/create-web-call/",
  },
  // Phone Numbers
  PHONE_NUMBERS: {
    BASE: "phone-numbers/",
    SEARCH: "phone-numbers/search-available/",
    PURCHASE: "phone-numbers/purchase/",
    RELEASE: (id: number) => `phone-numbers/${id}/release/`,
  },
} as const;

// Request timeouts
export const API_TIMEOUTS = {
  DEFAULT: 30000, // 30 seconds
  LONG_RUNNING: 60000, // 60 seconds for long operations
} as const;
