import { useState, useEffect } from "react";
import { Audio, AVPlaybackStatus } from "expo-av";
import { useTranslation } from "react-i18next";
import { showError } from "@/app/utils/toast";

export const useAudioPlayer = () => {
  const { t } = useTranslation();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setPlaybackPosition(status.positionMillis);
      setPlaybackDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);

      if (status.didJustFinish) {
        setIsPlaying(false);
        setPlaybackPosition(0);
      }
    }
  };

  const handlePlayRecording = async (recordingUrl: string) => {
    try {
      if (sound) {
        // If sound exists, toggle play/pause
        const status = await sound.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await sound.pauseAsync();
        } else {
          await sound.playAsync();
        }
        return;
      }

      // Load and play new sound
      setIsLoadingAudio(true);

      // Set audio mode for playback
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordingUrl },
        { shouldPlay: true },
        onPlaybackStatusUpdate,
      );

      setSound(newSound);
      setIsPlaying(true);
    } catch (error) {
      console.error("Error playing recording:", error);
      showError(
        t("callDetails.playbackError", "Playback Error"),
        t(
          "callDetails.playbackErrorMessage",
          "Failed to play recording. Please try again.",
        ),
      );
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const handleStopRecording = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
      setPlaybackPosition(0);
      setPlaybackDuration(0);
    }
  };

  const formatPlaybackTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return {
    sound,
    isPlaying,
    isLoadingAudio,
    playbackPosition,
    playbackDuration,
    handlePlayRecording,
    handleStopRecording,
    formatPlaybackTime,
  };
};
