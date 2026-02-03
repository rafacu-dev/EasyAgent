// types.d.ts

export type UserTier = "free" | "pro" | "business" | "enterprise";

export interface UserProfile {
  id: string;
  email: string;
  company_name: string;
  sector: string;
  tier: UserTier;
  tier_updated_at: string | null;
  social_media_and_web: string;
}

export interface AgentConfig {
  id: string;
  sector: string;
  companyName: string;
  socialMediaAndWeb: string;
  agentGender: "male" | "female";
  agentName: string;
  agentDescription: string;
  companyServices?: string;
  companyDescription?: string;
  language?: string;
}

export interface AgentContextType {
  agentConfig: AgentConfig | null;
  isLoading: boolean;
  phoneNumber: string | null;
  refreshAgentConfig: () => Promise<void>;
  refreshPhoneNumber: () => Promise<void>;
  updateAgentConfig: (config: AgentConfig) => Promise<void>;
}

export interface RecentCallItem {
  id: string;
  number: string;
  duration: string;
  date: string;
  status: string;
  direction?: string;
  fromNumber?: string;
  toNumber?: string;
  callType?: string;
  callSource?: string;
  fromContactName?: string | null;
  toContactName?: string | null;
}

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show"
  | "rescheduled";

export interface Appointment {
  id: number;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  client_name: string;
  client_phone: string;
  client_email: string;
  status: AppointmentStatus;
  notes: string;
  agent: number | null;
  agent_name: string | null;
  created_by_agent: boolean;
  is_past: boolean;
}

export interface MonthResponse {
  data: Appointment[];
  appointment_dates: string[];
  month: number;
  year: number;
}

// Phone number data from API
export interface PhoneNumberData {
  id: number;
  phone_number: string;
  friendly_name: string;
  agent: number | null;
  status: string;
}

// US Carrier type for call forwarding
export interface USCarrier {
  id: string;
  name: string;
  logo: string;
  activateAll: string;
  deactivate: string;
  activateNoAnswer: string;
  activateBusy: string;
  notes: string;
}

// Contact type
export interface Contact {
  id: number;
  name: string;
  phone_number: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

// Message type
export interface Message {
  id: number;
  twilio_sid: string;
  from_number: string;
  to_number: string;
  body: string;
  direction: "inbound" | "outbound";
  status: "queued" | "sending" | "sent" | "delivered" | "failed" | "received";
  error_code: string;
  error_message: string;
  contact: number | null;
  contact_name: string | null;
  phone_number: number | null;
  phone_number_display: string | null;
  other_party: string;
  created_at: string;
  updated_at: string;
}

// Conversation type
export interface Conversation {
  other_party: string;
  contact_name: string | null;
  contact_id: number | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  phone_number_id: number;
  phone_number_display: string;
}

// Device Contact types (expo-contacts)
export interface DeviceContact {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  phoneNumbers: ContactPhoneNumber[];
  emails: ContactEmail[];
  imageAvailable: boolean;
  image?: { uri: string };
}

export interface ContactPhoneNumber {
  id?: string;
  label?: string;
  number: string;
  isPrimary?: boolean;
}

export interface ContactEmail {
  id?: string;
  label?: string;
  email: string;
  isPrimary?: boolean;
}

export interface ContactPermissionResult {
  granted: boolean;
  canAskAgain: boolean;
}
