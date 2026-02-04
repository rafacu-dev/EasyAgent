import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/app/utils/axios-interceptor";
import type { PhoneNumberData } from "@/app/utils/types.d";

// Fetch phone numbers
const fetchPhoneNumbers = async (): Promise<PhoneNumberData[]> => {
  const response = await apiClient.get("phone-numbers/");
  return response?.data ?? response?.phone_numbers ?? [];
};

export const usePhoneNumbersQuery = () => {
  return useQuery({
    queryKey: ["phoneNumbers"],
    queryFn: fetchPhoneNumbers,
    staleTime: 3 * 60 * 1000, // 3 minutes
    retry: 2,
  });
};

// Get phone number for specific agent
export const useAgentPhoneNumber = (agentId: string | undefined) => {
  const { data: phoneNumbers, ...rest } = usePhoneNumbersQuery();

  const phoneNumber =
    phoneNumbers?.find((pn) => pn.agent === Number(agentId))?.phone_number ??
    null;

  return {
    phoneNumber,
    phoneNumbers,
    ...rest,
  };
};
