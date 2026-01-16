/**
 * Twilio Voice SDK Hook for React Native
 * Handles voice calling functionality using @twilio/voice-react-native-sdk
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Alert } from "react-native";
import { apiClient } from "../axios-interceptor";

// Types for the Voice SDK
interface VoiceToken {
  token: string;
  identity: string;
  from_number: string;
}

interface CallState {
  isConnecting: boolean;
  isConnected: boolean;
  isMuted: boolean;
  isOnHold: boolean;
  callSid: string | null;
  remoteParty: string | null;
  duration: number;
}

interface UseVoiceCallOptions {
  fromNumber: string | null;
  onCallStateChange?: (state: CallState) => void;
}

// Dynamic import to handle the SDK gracefully
let Voice: any = null;

const loadVoiceSDK = async () => {
  try {
    // @ts-ignore - SDK may not be installed
    const sdk = await import("@twilio/voice-react-native-sdk");
    Voice = sdk.Voice;
    return true;
  } catch (error) {
    console.warn("Twilio Voice SDK not available:", error);
    return false;
  }
};

export function useVoiceCall({
  fromNumber,
  onCallStateChange,
}: UseVoiceCallOptions) {
  const [isSDKAvailable, setIsSDKAvailable] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [callState, setCallState] = useState<CallState>({
    isConnecting: false,
    isConnected: false,
    isMuted: false,
    isOnHold: false,
    callSid: null,
    remoteParty: null,
    duration: 0,
  });

  const voiceRef = useRef<any>(null);
  const activeCallRef = useRef<any>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  // Update call state and notify parent
  const updateCallState = useCallback(
    (updates: Partial<CallState>) => {
      setCallState((prev) => {
        const newState = { ...prev, ...updates };
        onCallStateChange?.(newState);
        return newState;
      });
    },
    [onCallStateChange]
  );

  // Setup event handlers for an active call
  const setupCallEventHandlers = useCallback(
    (call: any) => {
      call.on("connected", () => {
        if (__DEV__) console.log("Call connected");
        updateCallState({
          isConnecting: false,
          isConnected: true,
          callSid: call.getSid?.() || null,
        });
        // Start duration timer
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
        }
        durationIntervalRef.current = setInterval(() => {
          setCallState((prev) => ({ ...prev, duration: prev.duration + 1 }));
        }, 1000);
      });

      call.on("reconnecting", () => {
        if (__DEV__) console.log("Call reconnecting...");
      });

      call.on("reconnected", () => {
        if (__DEV__) console.log("Call reconnected");
      });

      call.on("disconnected", (error?: any) => {
        if (__DEV__) console.log("Call disconnected", error);
        // Stop duration timer
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
        updateCallState({
          isConnecting: false,
          isConnected: false,
          isMuted: false,
          isOnHold: false,
          callSid: null,
          remoteParty: null,
          duration: 0,
        });
        activeCallRef.current = null;
      });

      call.on("ringing", () => {
        if (__DEV__) console.log("Call ringing...");
      });
    },
    [updateCallState]
  );

  // Handle accepting incoming call
  const handleAcceptCall = useCallback(
    async (callInvite: any) => {
      try {
        const call = await callInvite.accept();
        setupCallEventHandlers(call);
        activeCallRef.current = call;
      } catch (error) {
        console.error("Failed to accept call:", error);
      }
    },
    [setupCallEventHandlers]
  );

  // Initialize Voice SDK
  useEffect(() => {
    const initSDK = async () => {
      const sdkLoaded = await loadVoiceSDK();
      setIsSDKAvailable(sdkLoaded);

      if (sdkLoaded && Voice) {
        try {
          voiceRef.current = new Voice();

          // Set up event listeners for incoming calls (optional)
          voiceRef.current.on("callInvite", (callInvite: any) => {
            if (__DEV__) console.log("Incoming call invite:", callInvite);
            // Handle incoming call - could show UI to accept/reject
            Alert.alert("Incoming Call", `Call from ${callInvite.from}`, [
              {
                text: "Reject",
                style: "destructive",
                onPress: () => callInvite.reject(),
              },
              { text: "Accept", onPress: () => handleAcceptCall(callInvite) },
            ]);
          });

          voiceRef.current.on("error", (error: any) => {
            console.error("Voice SDK error:", error);
          });

          setIsInitialized(true);
          if (__DEV__) console.log("Voice SDK initialized successfully");
        } catch (error) {
          console.error("Failed to initialize Voice SDK:", error);
        }
      }
    };

    initSDK();

    return () => {
      // Cleanup
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (activeCallRef.current) {
        activeCallRef.current.disconnect();
      }
    };
  }, [handleAcceptCall]);

  // Get access token from backend
  const getAccessToken = useCallback(async (): Promise<VoiceToken | null> => {
    if (!fromNumber) {
      console.error("No from_number provided");
      return null;
    }

    try {
      const response = await apiClient.post("voice/token/", {
        from_number: fromNumber,
      });
      return response.data as VoiceToken;
    } catch (error: any) {
      console.error("Failed to get access token:", error);
      throw new Error(
        error.response?.data?.error || "Failed to get access token"
      );
    }
  }, [fromNumber]);

  // Make an outgoing call
  const makeCall = useCallback(
    async (toNumber: string): Promise<boolean> => {
      if (!isSDKAvailable || !voiceRef.current) {
        Alert.alert(
          "Voice SDK Not Available",
          "The voice calling feature is not available on this device. Please ensure you have the proper native modules installed."
        );
        return false;
      }

      if (!fromNumber) {
        Alert.alert("Error", "No phone number available for making calls");
        return false;
      }

      if (activeCallRef.current) {
        Alert.alert("Error", "A call is already in progress");
        return false;
      }

      try {
        updateCallState({ isConnecting: true, remoteParty: toNumber });

        // Get fresh access token
        const tokenData = await getAccessToken();
        if (!tokenData) {
          updateCallState({ isConnecting: false });
          return false;
        }

        // Connect the call
        const call = await voiceRef.current.connect(tokenData.token, {
          params: {
            To: toNumber,
            from_number: fromNumber,
          },
        });

        activeCallRef.current = call;
        setupCallEventHandlers(call);

        if (__DEV__) console.log("Call initiated to:", toNumber);
        return true;
      } catch (error: any) {
        console.error("Failed to make call:", error);
        updateCallState({ isConnecting: false, remoteParty: null });
        Alert.alert("Call Failed", error.message || "Failed to initiate call");
        return false;
      }
    },
    [
      isSDKAvailable,
      fromNumber,
      updateCallState,
      getAccessToken,
      setupCallEventHandlers,
    ]
  );

  // Disconnect active call
  const hangUp = useCallback(() => {
    if (activeCallRef.current) {
      activeCallRef.current.disconnect();
      activeCallRef.current = null;
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    updateCallState({
      isConnecting: false,
      isConnected: false,
      isMuted: false,
      isOnHold: false,
      callSid: null,
      remoteParty: null,
      duration: 0,
    });
  }, [updateCallState]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (activeCallRef.current) {
      const newMuteState = !callState.isMuted;
      activeCallRef.current.mute(newMuteState);
      updateCallState({ isMuted: newMuteState });
    }
  }, [callState.isMuted, updateCallState]);

  // Toggle hold
  const toggleHold = useCallback(() => {
    if (activeCallRef.current) {
      const newHoldState = !callState.isOnHold;
      activeCallRef.current.hold(newHoldState);
      updateCallState({ isOnHold: newHoldState });
    }
  }, [callState.isOnHold, updateCallState]);

  // Send DTMF digits
  const sendDigits = useCallback((digits: string) => {
    if (activeCallRef.current) {
      activeCallRef.current.sendDigits(digits);
    }
  }, []);

  // Register for incoming calls
  const registerForIncomingCalls = useCallback(async () => {
    if (!isSDKAvailable || !voiceRef.current || !fromNumber) {
      return false;
    }

    try {
      const tokenData = await getAccessToken();
      if (tokenData) {
        await voiceRef.current.register(tokenData.token);
        if (__DEV__) console.log("Registered for incoming calls");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to register for incoming calls:", error);
      return false;
    }
  }, [isSDKAvailable, fromNumber, getAccessToken]);

  // Unregister from incoming calls
  const unregisterFromIncomingCalls = useCallback(async () => {
    if (!isSDKAvailable || !voiceRef.current || !fromNumber) {
      return;
    }

    try {
      const tokenData = await getAccessToken();
      if (tokenData) {
        await voiceRef.current.unregister(tokenData.token);
        if (__DEV__) console.log("Unregistered from incoming calls");
      }
    } catch (error) {
      console.error("Failed to unregister from incoming calls:", error);
    }
  }, [isSDKAvailable, fromNumber, getAccessToken]);

  // Format duration as mm:ss
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return {
    // State
    isSDKAvailable,
    isInitialized,
    callState,
    formattedDuration: formatDuration(callState.duration),

    // Actions
    makeCall,
    hangUp,
    toggleMute,
    toggleHold,
    sendDigits,
    registerForIncomingCalls,
    unregisterFromIncomingCalls,
  };
}

export default useVoiceCall;
