import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "./storage";
import type { UserProfile, UserTier } from "./types";

interface UserContextType {
  user: UserProfile | null;
  isLoading: boolean;
  tier: UserTier;
  isProOrAbove: boolean;
  isBusinessOrAbove: boolean;
  refreshUser: () => Promise<void>;
  updateUserCache: (userData: UserProfile) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from cache
  const loadUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const cachedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (cachedUser) {
        setUser(JSON.parse(cachedUser) as UserProfile);
      } else {
        setUser(null);
      }
    } catch (error) {
      if (__DEV__) console.error("Error loading user:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    await loadUser();
  }, [loadUser]);

  // Update user cache (used after login/tier change)
  const updateUserCache = useCallback(async (userData: UserProfile) => {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    setUser(userData);
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const tier: UserTier = user?.tier ?? "free";
  const isProOrAbove = ["pro", "business", "enterprise"].includes(tier);
  const isBusinessOrAbove = ["business", "enterprise"].includes(tier);

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        tier,
        isProOrAbove,
        isBusinessOrAbove,
        refreshUser,
        updateUserCache,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
