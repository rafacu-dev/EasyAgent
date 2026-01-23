/**
 * Transcription and Translation Utilities
 * Helper functions for audio transcription and translation using OpenAI API
 */

import { apiClient } from "./axios-interceptor";

export interface TranscriptionOptions {
  /** Audio file URI from device */
  audioUri: string;
  /** Source language code (ISO-639-1 format, e.g., 'es', 'en', 'fr') */
  language?: string;
  /** Whether to translate the audio */
  translate?: boolean;
  /** Target language for translation (default: 'en') */
  targetLanguage?: string;
}

export interface TranscriptionResponse {
  /** Transcribed text (if translate=false) */
  transcription?: string;
  /** Translated text (if translate=true) */
  translation?: string;
  /** Language of the transcription/translation */
  language?: string;
  /** Target language (if translation was used) */
  target_language?: string;
  /** Method used for processing */
  method?: string;
}

/**
 * Transcribe audio file to text
 * @param options Transcription options
 * @returns Transcription result
 */
export async function transcribeAudio(
  options: TranscriptionOptions,
): Promise<TranscriptionResponse> {
  const {
    audioUri,
    language = "es",
    translate = false,
    targetLanguage = "en",
  } = options;

  const formData = new FormData();
  formData.append("audio", {
    uri: audioUri,
    type: "audio/m4a",
    name: "recording.m4a",
  } as any);

  formData.append("language", language);

  if (translate) {
    formData.append("translate", "true");
    formData.append("target_language", targetLanguage);
  }

  try {
    const response = await apiClient.post("transcribe/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    console.log("Transcription API response:", response);
    // API returns nested data object: { data: { transcription/translation, ... } }
    return response.data || {};
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to process audio");
  }
}

/**
 * Translate audio file to target language
 * @param audioUri Audio file URI from device
 * @param targetLanguage Target language code (default: 'en')
 * @returns Translation result
 */
export async function translateAudio(
  audioUri: string,
  targetLanguage: string = "en",
): Promise<string> {
  const result = await transcribeAudio({
    audioUri,
    translate: true,
    targetLanguage,
  });

  return result.translation || "";
}

/**
 * Get text from audio (transcription or translation)
 * @param result Transcription response
 * @returns The text content (transcription or translation)
 */
export function getTextFromResult(result: TranscriptionResponse): string {
  return result.transcription || result.translation || "";
}
