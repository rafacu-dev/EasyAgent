import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/app/utils/axios-interceptor";
import { Colors } from "@/app/utils/colors";

interface CallDetails {
  id: string;
  from_number?: string;
  to_number?: string;
  duration_ms?: number;
  start_timestamp?: number;
  end_timestamp?: number;
  call_status?: "completed" | "missed" | "error" | "in_progress" | string;
  disconnect_reason?: string;
  direction?: "inbound" | "outbound" | string;
  call_type?: string;
  transcript?: string;
  recording_url?: string;
  call_analysis?: Record<string, any> | [string, any][];
  agent_name?: string;
  price?: number;
}

interface AgentInfo {
  name?: string;
}

export const useCallDetails = (id?: string) => {
  const { data, isLoading } = useQuery<
    CallDetails | { call?: CallDetails; agent?: AgentInfo } | undefined
  >({
    queryKey: ["callDetails", id],
    queryFn: async ({ queryKey }) => {
      const res = await apiClient.get(`calls/${queryKey[1]}/`);
      return res;
    },
    enabled: !!id,
  });

  // Extract phone numbers from call data
  const rawCall: CallDetails | undefined =
    (data && (data as any).call) || (data as CallDetails) || undefined;

  const displayCall: CallDetails = rawCall ?? {
    id: String(id ?? "unknown"),
    call_status: "unknown",
  };

  const displayAgent: AgentInfo = (data && (data as any).agent) || {
      name: rawCall?.agent_name,
    } || { name: "Unknown" };

  const otherPartyNumber =
    rawCall?.direction === "inbound"
      ? rawCall?.from_number
      : rawCall?.to_number;

  const toObj = (analysis?: CallDetails["call_analysis"]) => {
    if (!analysis) return {} as Record<string, any>;
    if (Array.isArray(analysis)) {
      const o: Record<string, any> = {};
      analysis.forEach(([k, v]) => {
        o[k] = v;
      });
      return o;
    }
    return analysis as Record<string, any>;
  };

  const callAnalysis = toObj(displayCall.call_analysis);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "completed":
        return Colors.success;
      case "in_progress":
        return Colors.info;
      case "missed":
        return Colors.statusMissed;
      case "error":
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const getDirectionInfo = (direction?: string) => {
    switch (direction) {
      case "inbound":
        return { icon: "arrow-down-circle" as const, color: Colors.success };
      case "outbound":
        return { icon: "arrow-up-circle" as const, color: Colors.info };
      default:
        return { icon: "help-circle" as const, color: Colors.textSecondary };
    }
  };

  // Parse transcript into chat messages
  const parseTranscript = (transcript?: string) => {
    if (!transcript) return [];

    const messages: { role: "agent" | "client"; text: string }[] = [];
    const lines = transcript.split("\n");

    let currentRole: "agent" | "client" | null = null;
    let currentText = "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Check if line starts with role indicator
      if (
        trimmed.toLowerCase().startsWith("agent:") ||
        trimmed.toLowerCase().startsWith("assistant:")
      ) {
        if (currentRole && currentText) {
          messages.push({ role: currentRole, text: currentText.trim() });
        }
        currentRole = "agent";
        currentText = trimmed.substring(trimmed.indexOf(":") + 1).trim();
      } else if (
        trimmed.toLowerCase().startsWith("client:") ||
        trimmed.toLowerCase().startsWith("user:") ||
        trimmed.toLowerCase().startsWith("customer:")
      ) {
        if (currentRole && currentText) {
          messages.push({ role: currentRole, text: currentText.trim() });
        }
        currentRole = "client";
        currentText = trimmed.substring(trimmed.indexOf(":") + 1).trim();
      } else {
        // Continue current message
        if (currentText) currentText += " ";
        currentText += trimmed;
      }
    }

    // Add last message
    if (currentRole && currentText) {
      messages.push({ role: currentRole, text: currentText.trim() });
    }

    // If no role indicators found, treat as single agent message
    if (messages.length === 0 && transcript.trim()) {
      messages.push({ role: "agent", text: transcript.trim() });
    }

    return messages;
  };

  const transcriptMessages = parseTranscript(displayCall.transcript);
  const directionInfo = getDirectionInfo(displayCall.direction);

  return {
    isLoading,
    displayCall,
    displayAgent,
    otherPartyNumber,
    callAnalysis,
    transcriptMessages,
    directionInfo,
    getStatusColor,
  };
};

export type { CallDetails, AgentInfo };
