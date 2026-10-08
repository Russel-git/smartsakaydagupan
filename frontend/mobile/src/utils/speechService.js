import { Platform } from "react-native";

// Lazy load expo-speech safely if available on mobile
let ExpoSpeech = null;
try {
  ExpoSpeech = require("expo-speech");
} catch (e) {
  // Graceful fallback for web or environments where expo-speech is not yet built
}

/**
 * Strips markdown syntax, asterisks, hash headers, and URLs so the voice reads
 * smoothly like a real human transit officer.
 */
export const cleanMarkdownForSpeech = (rawText) => {
  if (!rawText) return "";

  return rawText
    // Remove markdown links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove markdown bold/italic asterisks or underscores
    .replace(/(\*\*|\*|__|_)/g, "")
    // Remove markdown headers #, ##, etc.
    .replace(/^#+\s+/gm, "")
    // Remove blockquotes >
    .replace(/^>\s+/gm, "")
    // Remove bullet points like "* ", "- ", "• "
    .replace(/^[\s]*[-*•]\s+/gm, "")
    // Remove backticks / code blocks
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    // Replace multiple newlines with single space/period pause
    .replace(/\n+/g, ". ")
    // Clean up multiple spaces
    .replace(/\s{2,}/g, " ")
    .trim();
};

class SpeechService {
  constructor() {
    this.recognitionInstance = null;
    this.isListening = false;
    this.isSpeaking = false;
    this.currentUtterance = null;
  }

  // ==========================================
  // SPEECH-TO-TEXT (STT / VOICE INPUT)
  // ==========================================

  /**
   * Check if Speech Recognition is supported on the current device/browser.
   */
  isRecognitionSupported() {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    }
    // On native mobile, returns false unless custom native speech module is mounted
    return false;
  }

  /**
   * Start listening to the commuter's voice.
   * @param {Object} options
   * @param {Function} options.onResult - callback(transcript: string, isFinal: boolean)
   * @param {Function} options.onError - callback(error: any)
   * @param {Function} options.onEnd - callback()
   * @param {string} options.lang - Language code ('fil-PH', 'en-PH', 'en-US')
   */
  startListening({ onResult, onError, onEnd, lang = "fil-PH" } = {}) {
    if (!this.isRecognitionSupported()) {
      const err = new Error(
        "Voice input is not supported in this browser/device. Please use Google Chrome, Edge, or Safari."
      );
      if (onError) onError(err);
      return null;
    }

    try {
      this.stopListening();

      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = lang;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        this.isListening = true;
      };

      recognition.onresult = (event) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        const isFinal = Boolean(finalTranscript);

        if (onResult && currentText) {
          onResult(currentText.trim(), isFinal);
        }
      };

      recognition.onerror = (event) => {
        console.warn("[SpeechService] Recognition error:", event.error);
        this.isListening = false;
        if (onError) onError(event);
      };

      recognition.onend = () => {
        this.isListening = false;
        this.recognitionInstance = null;
        if (onEnd) onEnd();
      };

      this.recognitionInstance = recognition;
      recognition.start();

      return {
        stop: () => this.stopListening(),
      };
    } catch (error) {
      console.error("[SpeechService] Failed to start recognition:", error);
      this.isListening = false;
      if (onError) onError(error);
      return null;
    }
  }

  /**
   * Stop active speech recognition.
   */
  stopListening() {
    if (this.recognitionInstance) {
      try {
        this.recognitionInstance.stop();
      } catch (e) {
        // Ignore already stopped
      }
      this.recognitionInstance = null;
    }
    this.isListening = false;
  }

  // ==========================================
  // TEXT-TO-SPEECH (TTS / VOICE-OVER OUTPUT)
  // ==========================================

  /**
   * Check if Text-to-Speech playback is supported.
   */
  isSynthesisSupported() {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      return "speechSynthesis" in window;
    }
    return !!(ExpoSpeech && ExpoSpeech.speak);
  }

  /**
   * Speak text out loud.
   * @param {string} text
   * @param {Object} options
   * @param {string} options.lang - Preferred language ('fil-PH', 'en-PH', 'en-US')
   * @param {number} options.rate - Speech rate (0.8 - 1.2, default 1.0)
   * @param {number} options.pitch - Voice pitch (default 1.0)
   * @param {Function} options.onStart
   * @param {Function} options.onDone
   * @param {Function} options.onError
   */
  speak(
    text,
    {
      lang = "fil-PH",
      rate = 1.0,
      pitch = 1.0,
      onStart,
      onDone,
      onError,
    } = {}
  ) {
    const cleaned = cleanMarkdownForSpeech(text);
    if (!cleaned) return;

    this.stopSpeaking();

    // 1. Web Environment (window.speechSynthesis)
    if (Platform.OS === "web" && typeof window !== "undefined" && window.speechSynthesis) {
      try {
        const utterance = new window.SpeechSynthesisUtterance(cleaned);
        utterance.rate = rate;
        utterance.pitch = pitch;

        // Try to select appropriate voice if available
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(
          (v) =>
            v.lang.toLowerCase().includes("fil") ||
            v.lang.toLowerCase().includes("tl") ||
            v.lang.toLowerCase().includes("en-ph")
        ) || voices.find((v) => v.lang.toLowerCase().startsWith("en"));

        if (preferredVoice) {
          utterance.voice = preferredVoice;
          utterance.lang = preferredVoice.lang;
        } else {
          utterance.lang = lang;
        }

        utterance.onstart = () => {
          this.isSpeaking = true;
          if (onStart) onStart();
        };

        utterance.onend = () => {
          this.isSpeaking = false;
          this.currentUtterance = null;
          if (onDone) onDone();
        };

        utterance.onerror = (e) => {
          this.isSpeaking = false;
          this.currentUtterance = null;
          console.warn("[SpeechService] Speech synthesis error:", e);
          if (onError) onError(e);
        };

        this.currentUtterance = utterance;
        window.speechSynthesis.speak(utterance);
        return;
      } catch (err) {
        console.error("[SpeechService] Web speak failed:", err);
        this.isSpeaking = false;
        if (onError) onError(err);
      }
    }

    // 2. Native Mobile (expo-speech)
    if (ExpoSpeech && ExpoSpeech.speak) {
      try {
        this.isSpeaking = true;
        if (onStart) onStart();

        ExpoSpeech.speak(cleaned, {
          language: lang,
          rate: rate,
          pitch: pitch,
          onDone: () => {
            this.isSpeaking = false;
            if (onDone) onDone();
          },
          onError: (e) => {
            this.isSpeaking = false;
            if (onError) onError(e);
          },
        });
      } catch (err) {
        console.error("[SpeechService] ExpoSpeech speak failed:", err);
        this.isSpeaking = false;
        if (onError) onError(err);
      }
    }
  }

  /**
   * Stop any active audio speech.
   */
  stopSpeaking() {
    if (Platform.OS === "web" && typeof window !== "undefined" && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }

    if (ExpoSpeech && ExpoSpeech.stop) {
      try {
        ExpoSpeech.stop();
      } catch (e) {}
    }

    this.isSpeaking = false;
    this.currentUtterance = null;
  }
}

const speechService = new SpeechService();
export default speechService;
