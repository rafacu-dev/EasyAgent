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
}
