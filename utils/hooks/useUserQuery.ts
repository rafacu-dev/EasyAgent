import { useQuery, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiClient } from "../axios-interceptor";
import { STORAGE_KEYS } from "../storage";
import type { UserProfile, UserTier } from "../types";

// Fetch user profile from API
const fetchUserProfile = async (): Promise<UserProfile> => {
  const response = await apiClient.get("profile/");
  const userData = response as UserProfile;
  // Save to cache
  await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));

  return userData;
};

export const useUserQuery = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["userProfile"],
    queryFn: fetchUserProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });

  const user = query.data ?? null;
  const tier: UserTier = user?.tier ?? "pro";
  const isProOrAbove = true;
  const isBusinessOrAbove = ["business", "enterprise"].includes(tier);

  // Helper to update cache (used after login)
  const updateUserCache = async (userData: UserProfile) => {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    queryClient.setQueryData(["userProfile"], userData);
  };

  return {
    ...query,
    user,
    tier,
    isProOrAbove,
    isBusinessOrAbove,
    updateUserCache,
  };
};
