/**
 * Twilio Voice SDK Hook for React Native
 * Handles voice calling functionality using @twilio/voice-react-native-sdk
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Platform } from "react-native";
import { apiClient } from "../axios-interceptor";
import { Audio } from "expo-av";
import { showError, showInfo } from "../toast";

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
  isSpeakerOn: boolean;
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
  console.log("[TWILIO DEBUG] Loading Voice SDK...");
  try {
    // @ts-ignore - SDK may not be installed
    const sdk = await import("@twilio/voice-react-native-sdk");
    Voice = sdk.Voice;
    console.log("[TWILIO DEBUG] Voice SDK loaded successfully");
    return true;
  } catch (error) {
    console.warn("[TWILIO DEBUG] ERROR: Voice SDK not available:", error);
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
    isSpeakerOn: false,
    callSid: null,
    remoteParty: null,
    duration: 0,
  });

  const voiceRef = useRef<any>(null);
  const activeCallRef = useRef<any>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const speakerStateRef = useRef<boolean>(false);

  // Update call state and notify parent
  const updateCallState = useCallback(
    (updates: Partial<CallState>) => {
      setCallState((prev) => {
        const newState = { ...prev, ...updates };
        onCallStateChange?.(newState);
        return newState;
      });
    },
    [onCallStateChange],
  );

  // Setup event handlers for an active call
  const setupCallEventHandlers = useCallback(
    (call: any) => {
      console.log("[TWILIO DEBUG] Setting up call event handlers");
      call.on("connected", async () => {
        const callSid = call.getSid?.() || null;
        console.log(`[TWILIO DEBUG] ✅ Call connected - SID: ${callSid}`);
        updateCallState({
          isConnecting: false,
          isConnected: true,
          callSid: callSid,
        });

        // Apply current speaker setting when call connects
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: !speakerStateRef.current,
          });
          console.log(
            `[TWILIO DEBUG] ✅ Audio mode set: ${
              speakerStateRef.current ? "SPEAKER" : "EARPIECE"
            }`,
          );
        } catch (error) {
          console.error(
            "[TWILIO DEBUG] ❌ Failed to set audio mode on connect:",
            error,
          );
        }

        // Start duration timer
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
        }
        durationIntervalRef.current = setInterval(() => {
          setCallState((prev) => ({ ...prev, duration: prev.duration + 1 }));
        }, 1000);
      });

      call.on("reconnecting", () => {
        console.log("[TWILIO DEBUG] 🔄 Call reconnecting...");
      });

      call.on("reconnected", () => {
        console.log("[TWILIO DEBUG] ✅ Call reconnected");
      });

      call.on("disconnected", (error?: any) => {
        console.log(
          "[TWILIO DEBUG] ❌ Call disconnected",
          error ? `Error: ${error}` : "",
        );
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
          isSpeakerOn: false,
          callSid: null,
          remoteParty: null,
          duration: 0,
        });
        activeCallRef.current = null;
      });

      call.on("ringing", () => {
        console.log("[TWILIO DEBUG] 📞 Call ringing...");
      });
    },
    [updateCallState],
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
    [setupCallEventHandlers],
  );

  // Initialize Voice SDK
  useEffect(() => {
    const initSDK = async () => {
      console.log("[TWILIO DEBUG] Initializing Voice SDK...");
      const sdkLoaded = await loadVoiceSDK();
      setIsSDKAvailable(sdkLoaded);
      console.log(`[TWILIO DEBUG] SDK available: ${sdkLoaded}`);

      if (sdkLoaded && Voice) {
        try {
          voiceRef.current = new Voice();
          console.log("[TWILIO DEBUG] Voice instance created");

          // Set up event listeners for incoming calls (optional)
          voiceRef.current.on("callInvite", (callInvite: any) => {
            console.log("[TWILIO DEBUG] 📞 Incoming call invite:", callInvite);
            // Handle incoming call - show notification
            showInfo("Incoming Call", `Call from ${callInvite.from}`);
            // Auto-accept incoming calls (or could add UI to accept/reject)
            handleAcceptCall(callInvite);
          });

          voiceRef.current.on("error", (error: any) => {
            console.error("[TWILIO DEBUG] ❌ Voice SDK error:", error);
          });

          setIsInitialized(true);
          console.log("[TWILIO DEBUG] ✅ Voice SDK initialized successfully");
        } catch (error) {
          console.error(
            "[TWILIO DEBUG] ❌ Failed to initialize Voice SDK:",
            error,
          );
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
    console.log("[TWILIO DEBUG] Requesting access token...");
    if (!fromNumber) {
      console.error("[TWILIO DEBUG] ERROR: No from_number provided");
      return null;
    }

    try {
      console.log(`[TWILIO DEBUG] Calling API with from_number: ${fromNumber}`);
      const response = await apiClient.post("voice/token/", {
        from_number: fromNumber,
      });
      console.log("[TWILIO DEBUG] ✅ Access token received", {
        identity: response.data.identity,
        from_number: response.data.from_number,
      });
      return response.data as VoiceToken;
    } catch (error: any) {
      console.error("[TWILIO DEBUG] ❌ Failed to get access token:", error);
      console.error("[TWILIO DEBUG] Error details:", error.response?.data);
      throw new Error(
        error.response?.data?.error || "Failed to get access token",
      );
    }
  }, [fromNumber]);

  // Make an outgoing call
  const makeCall = useCallback(
    async (toNumber: string): Promise<boolean> => {
      console.log(`[TWILIO DEBUG] 📞 makeCall called - To: ${toNumber}`);

      if (!isSDKAvailable || !voiceRef.current) {
        console.error("[TWILIO DEBUG] ERROR: Voice SDK not available");
        showError(
          "Voice SDK Not Available",
          "The voice calling feature is not available on this device. Please ensure you have the proper native modules installed.",
        );
        return false;
      }

      if (!fromNumber) {
        console.error("[TWILIO DEBUG] ERROR: No from_number available");
        showError("Error", "No phone number available for making calls");
        return false;
      }

      if (activeCallRef.current) {
        console.warn("[TWILIO DEBUG] WARNING: Call already in progress");
        showError("Error", "A call is already in progress");
        return false;
      }

      try {
        console.log(
          `[TWILIO DEBUG] Initiating call from ${fromNumber} to ${toNumber}`,
        );
        updateCallState({ isConnecting: true, remoteParty: toNumber });

        // Get fresh access token
        const tokenData = await getAccessToken();
        if (!tokenData) {
          console.error("[TWILIO DEBUG] ERROR: Failed to get token");
          updateCallState({ isConnecting: false });
          return false;
        }

        console.log("[TWILIO DEBUG] Connecting call with params:", {
          To: toNumber,
          from_number: fromNumber,
          identity: tokenData.identity,
        });

        // Connect the call
        const call = await voiceRef.current.connect(tokenData.token, {
          params: {
            To: toNumber,
            from_number: fromNumber,
          },
        });

        activeCallRef.current = call;
        setupCallEventHandlers(call);

        console.log("[TWILIO DEBUG] ✅ Call initiated successfully");
        return true;
      } catch (error: any) {
        console.error("[TWILIO DEBUG] ❌ Failed to make call:", error);
        console.error(
          "[TWILIO DEBUG] Error details:",
          JSON.stringify(error, null, 2),
        );
        updateCallState({ isConnecting: false, remoteParty: null });
        showError("Call Failed", error.message || "Failed to initiate call");
        return false;
      }
    },
    [
      isSDKAvailable,
      fromNumber,
      updateCallState,
      getAccessToken,
      setupCallEventHandlers,
    ],
  );

  // Disconnect active call
  const hangUp = useCallback(() => {
    console.log("[TWILIO DEBUG] 📴 Hanging up call");
    if (activeCallRef.current) {
      activeCallRef.current.disconnect();
      activeCallRef.current = null;
      speakerStateRef.current = false;
      console.log("[TWILIO DEBUG] Call disconnected");
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
      isSpeakerOn: false,
      callSid: null,
      remoteParty: null,
      duration: 0,
    });
  }, [updateCallState]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (activeCallRef.current) {
      const newMuteState = !callState.isMuted;
      console.log(
        `[TWILIO DEBUG] ${
          newMuteState ? "🔇" : "🔊"
        } Toggling mute: ${newMuteState}`,
      );
      activeCallRef.current.mute(newMuteState);
      updateCallState({ isMuted: newMuteState });
    }
  }, [callState.isMuted, updateCallState]);

  // Toggle hold
  const toggleHold = useCallback(() => {
    if (activeCallRef.current) {
      const newHoldState = !callState.isOnHold;
      console.log(
        `[TWILIO DEBUG] ${
          newHoldState ? "⏸️" : "▶️"
        } Toggling hold: ${newHoldState}`,
      );
      activeCallRef.current.hold(newHoldState);
      updateCallState({ isOnHold: newHoldState });
    }
  }, [callState.isOnHold, updateCallState]);

  // Toggle speaker
  const toggleSpeaker = useCallback(async () => {
    const newSpeakerState = !callState.isSpeakerOn;
    speakerStateRef.current = newSpeakerState;
    console.log(
      `[TWILIO DEBUG] ${
        newSpeakerState ? "🔊" : "🔉"
      } Toggling speaker: ${newSpeakerState}`,
    );
    try {
      // Set audio mode for speaker/earpiece
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: !newSpeakerState, // false = speaker, true = earpiece
      });
      updateCallState({ isSpeakerOn: newSpeakerState });
      console.log(
        `[TWILIO DEBUG] ✅ Audio routed to ${
          newSpeakerState ? "SPEAKER" : "EARPIECE"
        }`,
      );
    } catch (error) {
      console.error("[TWILIO DEBUG] ❌ Failed to toggle speaker:", error);
      showError("Error", "Failed to toggle speaker mode");
    }
  }, [callState.isSpeakerOn, updateCallState]);

  // Send DTMF digits
  const sendDigits = useCallback((digits: string) => {
    if (activeCallRef.current) {
      activeCallRef.current.sendDigits(digits);
    }
  }, []);

  // Register for incoming calls
  const registerForIncomingCalls = useCallback(async () => {
    console.log("[TWILIO DEBUG] Registering for incoming calls...");
    if (!isSDKAvailable || !voiceRef.current || !fromNumber) {
      console.error(
        "[TWILIO DEBUG] ERROR: Cannot register - SDK not available or no number",
      );
      return false;
    }

    try {
      const tokenData = await getAccessToken();
      if (tokenData) {
        await voiceRef.current.register(tokenData.token);
        console.log("[TWILIO DEBUG] ✅ Registered for incoming calls");
        return true;
      }
      return false;
    } catch (error) {
      console.error(
        "[TWILIO DEBUG] ❌ Failed to register for incoming calls:",
        error,
      );
      return false;
    }
  }, [isSDKAvailable, fromNumber, getAccessToken]);

  // Unregister from incoming calls
  const unregisterFromIncomingCalls = useCallback(async () => {
    console.log("[TWILIO DEBUG] Unregistering from incoming calls...");
    if (!isSDKAvailable || !voiceRef.current || !fromNumber) {
      return;
    }

    try {
      const tokenData = await getAccessToken();
      if (tokenData) {
        await voiceRef.current.unregister(tokenData.token);
        console.log("[TWILIO DEBUG] ✅ Unregistered from incoming calls");
      }
    } catch (error) {
      console.error(
        "[TWILIO DEBUG] ❌ Failed to unregister from incoming calls:",
        error,
      );
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
    toggleSpeaker,
    sendDigits,
    registerForIncomingCalls,
    unregisterFromIncomingCalls,
  };
}

export default useVoiceCall;
