export const BaseUrl = "http://10.173.217.160:8000/api/";
//export const BaseUrl = "https://apieasyinvoice.onrender.com"

// Centralized storage keys to avoid typos and ensure consistency
export const STORAGE_KEYS = {
  AUTH_TOKEN: "authToken",
  REFRESH_TOKEN: "refreshToken",
  USER: "user",
  AGENT: "agent",
  PHONE_NUMBER: "phoneNumber",
  RETELL_AGENT_ID: "retellAgentId",
} as const;
