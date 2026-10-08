import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import AuthPromptModal from "../../components/common/AuthPromptModal";
import { assistantAPI } from "../../api/services";
import { FONTS, SPACING, RADIUS } from "../../utils/constants";
import { formatDate } from "../../utils/helpers";
import Markdown from "react-native-markdown-display";
import speechService from "../../utils/speechService";

const AssistantScreen = () => {
  const { colors } = useTheme();
  const { isGuest } = useAuth();

  const [promptVisible, setPromptVisible] = useState(false);
  const [messages, setMessages] = useState([]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showFAQs, setShowFAQs] = useState(true);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  // PWD Voice-Over Accessibility States
  const [isListening, setIsListening] = useState(false);
  const [voiceModeActive, setVoiceModeActive] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState(null);

  const [faqs] = useState([
    "What are the current jeepney fares?",
    "How can I check a jeepney route?",
    "How do I report a transport complaint?",
    "What are my rights as a commuter?",
  ]);

  const flatListRef = useRef(null);

  // --------------------------------------------------
  // CLEANUP ON UNMOUNT
  // --------------------------------------------------

  useEffect(() => {
    return () => {
      speechService.stopListening();
      speechService.stopSpeaking();
    };
  }, []);

  // --------------------------------------------------
  // AUTO SCROLL
  // --------------------------------------------------

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({
          animated: true,
        });
      }, 100);
    }
  }, [messages, loading]);

  // --------------------------------------------------
  // LOCAL HISTORY
  // --------------------------------------------------

  const loadChatHistory = async () => {
    if (isGuest) return;

    try {
      setHistoryLoading(true);

      const { data } = await assistantAPI.getHistoryList();

      setChatHistory(data.data || []);
    } catch (error) {
      console.log("Failed to load chat history:", error);
      setChatHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // --------------------------------------------------
  // SEND MESSAGE (SUPPORTS TEXT & PWD VOICE-OVER)
  // --------------------------------------------------

  const sendMessage = async (overrideText = null, fromVoice = false) => {
    const textToSend = (overrideText !== null ? overrideText : input).trim();
    if (!textToSend || loading) return;

    speechService.stopListening();
    setIsListening(false);
    setShowFAQs(false);

    const userMsg = {
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);

    if (overrideText === null) {
      setInput("");
    }
    setLoading(true);

    try {
      const { data } = await assistantAPI.chat({
        message: textToSend,
        sessionId,
      });

      setSessionId(data.data?.sessionId || sessionId);

      const assistantContent =
        data.data?.response ||
        data.data?.message ||
        "I apologize, I could not process that request.";

      const assistantMsg = {
        role: "assistant",
        content: assistantContent,
        timestamp: new Date(),
      };

      setMessages((prev) => {
        const nextList = [...prev, assistantMsg];
        const newAssistantIndex = nextList.length - 1;

        // Hands-Free PWD Voice-Over: Read response aloud if commuter asked via voice or has Voice Mode enabled
        if (fromVoice || voiceModeActive) {
          speechService.speak(assistantContent, {
            lang: "fil-PH",
            onStart: () => setSpeakingIndex(newAssistantIndex),
            onDone: () => setSpeakingIndex(null),
            onError: () => setSpeakingIndex(null),
          });
        }

        return nextList;
      });
    } catch (e) {
      const errContent =
        "Sorry, I'm having trouble connecting right now. Please try again later.";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: errContent,
          timestamp: new Date(),
        },
      ]);
      if (fromVoice || voiceModeActive) {
        speechService.speak(errContent);
      }
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // VOICE RECOGNITION (PWD STT INPUT)
  // --------------------------------------------------

  const toggleVoiceRecognition = () => {
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
      if (input.trim()) {
        sendMessage(input.trim(), true);
      }
    } else {
      speechService.stopSpeaking();
      setSpeakingIndex(null);

      const supported = speechService.isRecognitionSupported();
      if (!supported) {
        const msg =
          Platform.OS === "web"
            ? "Voice recognition requires a compatible browser like Google Chrome or Microsoft Edge. Please verify microphone access in your browser."
            : "Voice input is currently active in Web mode (Google Chrome/Edge). Please ensure microphone permissions are granted.";
        if (Platform.OS === "web") {
          window.alert(msg);
        } else {
          Alert.alert("Voice Input Not Supported", msg);
        }
        return;
      }

      setIsListening(true);
      speechService.startListening({
        lang: "fil-PH", // Supports Filipino & English seamlessly
        onResult: (transcript, isFinal) => {
          setInput(transcript);
          if (isFinal && transcript.trim()) {
            setTimeout(() => {
              sendMessage(transcript.trim(), true);
            }, 600);
          }
        },
        onError: (err) => {
          console.warn("Speech recognition warning:", err);
          setIsListening(false);
        },
        onEnd: () => {
          setIsListening(false);
        },
      });
    }
  };

  // --------------------------------------------------
  // VOICE PLAYBACK (PWD TTS OUTPUT)
  // --------------------------------------------------

  const handleToggleSpeak = (content, index) => {
    if (speakingIndex === index) {
      speechService.stopSpeaking();
      setSpeakingIndex(null);
    } else {
      setSpeakingIndex(index);
      speechService.speak(content, {
        lang: "fil-PH",
        onStart: () => setSpeakingIndex(index),
        onDone: () => setSpeakingIndex(null),
        onError: () => setSpeakingIndex(null),
      });
    }
  };

  // --------------------------------------------------
  // RENDER MESSAGE
  // --------------------------------------------------

  const renderMessage = ({ item, index }) => {
    const isUser = item.role === "user";
    const isSpeakingThis = speakingIndex === index;

    return (
      <View
        style={[styles.messageWrapper, isUser && styles.messageWrapperUser]}
      >
        <View
          style={[
            styles.messageBubble,

            isUser
              ? {
                  backgroundColor: colors.primary,
                  borderBottomRightRadius: 5,
                }
              : {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderBottomLeftRadius: 5,
                },
          ]}
        >
          <Markdown
            style={{
              body: {
                color: isUser ? "#FFFFFF" : colors.textPrimary,
                fontSize: FONTS.sizes.md,
                lineHeight: 22,
              },

              heading1: {
                color: isUser ? "#FFFFFF" : colors.textPrimary,
                fontSize: 22,
                fontWeight: "700",
                marginBottom: 8,
              },

              heading2: {
                color: isUser ? "#FFFFFF" : colors.textPrimary,
                fontSize: 19,
                fontWeight: "700",
                marginBottom: 6,
              },

              heading3: {
                color: isUser ? "#FFFFFF" : colors.textPrimary,
                fontSize: 17,
                fontWeight: "700",
                marginBottom: 5,
              },

              strong: {
                fontWeight: "700",
                color: isUser ? "#FFFFFF" : colors.textPrimary,
              },

              bullet_list: {
                marginBottom: 8,
              },

              ordered_list: {
                marginBottom: 8,
              },

              list_item: {
                marginBottom: 4,
              },

              paragraph: {
                marginTop: 0,
                marginBottom: 8,
              },

              table: {
                borderWidth: 1,
                borderColor: colors.border,
                marginVertical: 8,
              },

              th: {
                padding: 6,
                fontWeight: "700",
                backgroundColor: colors.background,
              },

              td: {
                padding: 6,
                borderWidth: 1,
                borderColor: colors.border,
              },

              code_inline: {
                backgroundColor: colors.background,
                color: colors.textPrimary,
                paddingHorizontal: 4,
              },
            }}
          >
            {item.content}
          </Markdown>

          <View
            style={[
              styles.messageFooter,
              { justifyContent: isUser ? "flex-end" : "space-between" },
            ]}
          >
            {!isUser && (
              <TouchableOpacity
                style={[
                  styles.speakActionBtn,
                  isSpeakingThis && {
                    backgroundColor: colors.primary + "18",
                  },
                ]}
                onPress={() => handleToggleSpeak(item.content, index)}
                accessibilityRole="button"
                accessibilityLabel={
                  isSpeakingThis ? "Stop Voice-Over" : "Listen to answer"
                }
              >
                <MaterialCommunityIcons
                  name={isSpeakingThis ? "volume-high" : "volume-medium"}
                  size={16}
                  color={isSpeakingThis ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.speakActionText,
                    {
                      color: isSpeakingThis ? colors.primary : colors.textMuted,
                    },
                  ]}
                >
                  {isSpeakingThis ? "Speaking..." : "Voice-over"}
                </Text>
              </TouchableOpacity>
            )}

            <Text
              style={[
                styles.messageTime,
                {
                  color: isUser ? "rgba(255,255,255,0.65)" : colors.textMuted,
                },
              ]}
            >
              {formatDate(item.timestamp)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // --------------------------------------------------
  // MAIN UI
  // --------------------------------------------------

  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      {/* ==================================================
          HEADER
          ================================================== */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          {/* Hamburger Menu */}
          <TouchableOpacity
            onPress={() => {
              setHistoryVisible(true);
              loadChatHistory();
            }}
            style={styles.menuBtn}
          >
            <MaterialCommunityIcons
              name="menu"
              size={26}
              color={colors.textPrimary}
            />
          </TouchableOpacity>

          {/* Robot Logo */}
          <View
            style={[
              styles.headerAvatar,
              {
                backgroundColor: colors.primary + "15",
              },
            ]}
          >
            <MaterialCommunityIcons
              name="robot"
              size={24}
              color={colors.primary}
            />
          </View>

          {/* Title */}
          <View>
            <Text
              style={[
                styles.headerTitle,
                {
                  color: colors.textPrimary,
                },
              ]}
            >
              AI Assistant
            </Text>

            <Text
              style={[
                styles.headerStatus,
                {
                  color: colors.accent,
                },
              ]}
            >
              ● Online
            </Text>
          </View>
        </View>

        {/* Right Header: PWD Accessibility Voice-Over Switch */}
        <TouchableOpacity
          style={[
            styles.voiceModeToggle,
            {
              backgroundColor: voiceModeActive
                ? colors.primary + "18"
                : colors.background,
              borderColor: voiceModeActive ? colors.primary : colors.border,
            },
          ]}
          onPress={() => {
            const next = !voiceModeActive;
            setVoiceModeActive(next);
            if (!next) speechService.stopSpeaking();
          }}
          accessibilityRole="button"
          accessibilityLabel="Toggle PWD Hands-Free Voice Mode"
        >
          <MaterialCommunityIcons
            name={voiceModeActive ? "volume-high" : "volume-off"}
            size={18}
            color={voiceModeActive ? colors.primary : colors.textMuted}
          />
          <Text
            style={[
              styles.voiceModeText,
              { color: voiceModeActive ? colors.primary : colors.textMuted },
            ]}
          >
            {voiceModeActive ? "Voice-Over ON" : "Voice-Over"}
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.chatCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        {/* ==================================================
            CHAT AREA
            ================================================== */}

        <View style={styles.chatArea}>
          {messages.length === 0 ? (
            <View style={styles.welcomeContainer}>
              <View style={styles.welcomeContent}>
                <MaterialCommunityIcons
                  name="robot"
                  size={38}
                  color={colors.primary}
                />
                <Text
                  style={[
                    styles.welcomeTitle,
                    {
                      color: colors.primary,
                    },
                  ]}
                >
                  KUMUSTA
                </Text>
                <Text
                  style={[
                    styles.welcomeSubtitle,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  Welcome to SmartSakay AI Assistant
                </Text>
              </View>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(_, index) => index.toString()}
              renderItem={renderMessage}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({
                  animated: true,
                })
              }
            />
          )}
        </View>

        {/* ==================================================
            THINKING INDICATOR
            ================================================== */}

        {loading && (
          <View style={styles.loadingContainer}>
            <View
              style={[
                styles.loadingBubble,
                {
                  backgroundColor: colors.surface,
                },
              ]}
            >
              <ActivityIndicator size="small" color={colors.primary} />

              <Text
                style={[
                  styles.loadingText,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                Thinking...
              </Text>
            </View>
          </View>
        )}

        {/* ==================================================
            GUEST LOCKED BAR
            ================================================== */}

        {isGuest ? (
          <View
            style={[
              styles.guestBar,
              {
                backgroundColor: colors.surface,
                borderTopColor: colors.border,
              },
            ]}
          >
            <View style={styles.guestTextContainer}>
              <Text
                style={[
                  styles.guestTitle,
                  {
                    color: colors.textPrimary,
                  },
                ]}
              >
                Account Required to Chat
              </Text>

              <Text
                style={[
                  styles.guestSubtitle,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                Sign up for free to get 24/7 Dagupan transit and fare advice.
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.guestButton,
                {
                  backgroundColor: colors.primary,
                },
              ]}
              onPress={() => setPromptVisible(true)}
            >
              <Text style={styles.guestButtonText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ==================================================
                INPUT
                ================================================== */}

            {showFAQs && (
              <View
                style={[
                  styles.faqContainer,
                  {
                    backgroundColor: colors.surface,
                  },
                ]}
              >
                {faqs.map((question, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleFAQ(question)}
                    disabled={loading}
                    style={[
                      styles.faqButton,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.faqText,
                        {
                          color: colors.textPrimary,
                        },
                      ]}
                    >
                      {question}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Listening Indicator Banner for PWD Accessibility */}
            {isListening && (
              <View
                style={[
                  styles.listeningBanner,
                  {
                    backgroundColor: colors.surface,
                    borderColor: "#EF4444",
                  },
                ]}
              >
                <View style={styles.listeningLeft}>
                  <View style={styles.pulsingDot} />
                  <Text
                    style={[
                      styles.listeningText,
                      { color: colors.textPrimary },
                    ]}
                  >
                    Listening... Speak transit question in Tagalog or English
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={toggleVoiceRecognition}
                  style={styles.doneListeningBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Stop listening and send"
                >
                  <Text style={styles.doneListeningText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}

            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: colors.surface,
                  borderTopColor: colors.border,
                },
              ]}
            >
              {/* PWD Accessible Voice Microphone Button */}
              <TouchableOpacity
                onPress={toggleVoiceRecognition}
                disabled={loading}
                style={[
                  styles.micButton,
                  isListening && styles.micButtonActive,
                  {
                    backgroundColor: isListening
                      ? "#EF4444"
                      : colors.primary + "15",
                    borderColor: isListening ? "#EF4444" : colors.primary,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={
                  isListening
                    ? "Stop voice input"
                    : "Speak question using voice"
                }
              >
                <MaterialCommunityIcons
                  name={isListening ? "microphone" : "microphone-outline"}
                  size={22}
                  color={isListening ? "#FFFFFF" : colors.primary}
                />
              </TouchableOpacity>

              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: isListening ? "#EF4444" : colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder={
                  isListening
                    ? "Listening... Speak your transit question..."
                    : "Type or tap mic to speak..."
                }
                placeholderTextColor={
                  isListening ? "#EF4444" : colors.textMuted
                }
                value={input}
                onChangeText={setInput}
                multiline
                editable={!loading && !isListening}
                onSubmitEditing={() => sendMessage()}
              />

              <TouchableOpacity
                onPress={() => sendMessage()}
                disabled={!input.trim() || loading || isListening}
                style={[
                  styles.sendButton,
                  {
                    backgroundColor:
                      input.trim() && !loading && !isListening
                        ? colors.primary
                        : colors.border,
                  },
                ]}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* ==================================================
          CHAT HISTORY DRAWER
          ================================================== */}

      {historyVisible && (
        <View style={styles.historyOverlay}>
          {/* Background overlay */}
          <TouchableOpacity
            style={styles.historyBackdrop}
            activeOpacity={1}
            onPress={() => setHistoryVisible(false)}
          />

          {/* Drawer */}
          <View
            style={[
              styles.historyDrawer,
              {
                backgroundColor: colors.surface,
                borderRightColor: colors.border,
              },
            ]}
          >
            {/* Drawer Header */}
            <View
              style={[
                styles.historyHeader,
                {
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.historyTitle,
                  {
                    color: colors.textPrimary,
                  },
                ]}
              >
                Chat History
              </Text>

              <TouchableOpacity
                onPress={() => setHistoryVisible(false)}
                style={styles.historyCloseBtn}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            {/* New Chat */}
            <TouchableOpacity
              style={[
                styles.newChatButton,
                {
                  backgroundColor: colors.primary,
                },
              ]}
              onPress={() => {
                setMessages([]);
                setSessionId(null);
                setShowFAQs(true);
                setHistoryVisible(false);
              }}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />

              <Text style={styles.newChatText}>New Chat</Text>
            </TouchableOpacity>

            {/* Clear History */}
            <TouchableOpacity
              style={[
                styles.clearHistoryButton,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              onPress={clearChat}
            >
              <MaterialCommunityIcons
                name="delete-outline"
                size={19}
                color={colors.error || "#D9534F"}
              />

              <Text
                style={[
                  styles.clearHistoryText,
                  {
                    color: colors.error || "#D9534F",
                  },
                ]}
              >
                Clear History
              </Text>
            </TouchableOpacity>

            {/* Chat History */}
            <View style={styles.historyList}>
              {historyLoading ? (
                <View style={styles.emptyHistory}>
                  <ActivityIndicator size="small" color={colors.primary} />

                  <Text
                    style={[
                      styles.emptyHistoryText,
                      {
                        color: colors.textMuted,
                      },
                    ]}
                  >
                    Loading chat history...
                  </Text>
                </View>
              ) : chatHistory.length > 0 ? (
                <FlatList
                  data={chatHistory}
                  keyExtractor={(item) => item.sessionId}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.historyItem,
                        {
                          backgroundColor:
                            item.sessionId === sessionId
                              ? colors.primary + "10"
                              : "transparent",
                        },
                      ]}
                      onPress={() => loadConversation(item.sessionId)}
                    >
                      <MaterialCommunityIcons
                        name="message-text-outline"
                        size={20}
                        color={
                          item.sessionId === sessionId
                            ? colors.primary
                            : colors.textMuted
                        }
                      />

                      <View style={styles.historyItemContent}>
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.historyItemTitle,
                            {
                              color: colors.textPrimary,
                            },
                          ]}
                        >
                          {item.title}
                        </Text>

                        <Text
                          numberOfLines={1}
                          style={[
                            styles.historyItemPreview,
                            {
                              color: colors.textMuted,
                            },
                          ]}
                        >
                          {item.lastMessage}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              ) : (
                <View style={styles.emptyHistory}>
                  <MaterialCommunityIcons
                    name="message-outline"
                    size={38}
                    color={colors.textMuted}
                  />

                  <Text
                    style={[
                      styles.emptyHistoryText,
                      {
                        color: colors.textMuted,
                      },
                    ]}
                  >
                    No chat history yet
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}
      {/* ==================================================
          AUTH PROMPT
          Existing SmartSakay functionality
          ================================================== */}

      <AuthPromptModal
        visible={promptVisible}
        onClose={() => setPromptVisible(false)}
        title="Unlock SmartSakay AI Assistant"
        message="Create a free commuter account to receive 24/7 AI-powered transit guidance, fare estimates, and route assistance across Dagupan City."
        icon="robot"
        featureTag="AI Assistant"
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  chatCard: {
    flex: 1,
    width: "100%",
    overflow: "hidden",
  },

  // --------------------------------------------------------
  // HEADER
  // --------------------------------------------------------

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 48,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderBottomWidth: 1,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },

  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
  },

  headerStatus: {
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
  },

  clearBtn: {
    padding: SPACING.sm,
  },

  menuBtn: {
    padding: SPACING.xs,
    justifyContent: "center",
    alignItems: "center",
  },

  // --------------------------------------------------------
  // CHAT HISTORY
  // --------------------------------------------------------

  clearHistoryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: SPACING.sm,
  },

  clearHistoryText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
  },

  historyOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10000,
    flexDirection: "row",
  },

  historyBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  historyDrawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: "78%",
    maxWidth: 340,
    borderRightWidth: 1,
    paddingTop: 48,
  },

  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },

  historyTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
  },

  historyCloseBtn: {
    padding: SPACING.xs,
  },

  newChatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.lg,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },

  newChatText: {
    color: "#FFFFFF",
    fontSize: FONTS.sizes.md,
    fontWeight: "700",
  },

  historyList: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },

  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },

  historyItemContent: {
    flex: 1,
  },

  historyItemTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
    marginBottom: 3,
  },

  historyItemPreview: {
    fontSize: FONTS.sizes.xs,
  },

  emptyHistory: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
  },

  emptyHistoryText: {
    fontSize: FONTS.sizes.sm,
    marginTop: SPACING.sm,
    textAlign: "center",
  },

  // --------------------------------------------------------
  // CHAT AREA
  // --------------------------------------------------------

  chatArea: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },

  messagesList: {
    padding: SPACING.lg,
    paddingBottom: SPACING.lg,
  },

  welcomeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
  },

  welcomeContent: {
    alignItems: "center",
    marginBottom: SPACING.lg,
  },

  welcomeIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
  },

  welcomeTitle: {
    fontSize: 50,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 3,
  },

  welcomeSubtitle: {
    fontSize: 15,
    textAlign: "center",
    fontWeight: "500",
  },

  initialMessageContainer: {
    width: "100%",
    maxWidth: 500,
  },

  // --------------------------------------------------------
  // MESSAGE BUBBLES
  // --------------------------------------------------------

  messageWrapper: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: SPACING.md,
  },

  messageWrapperUser: {
    justifyContent: "flex-end",
  },

  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
  },

  messageText: {
    fontSize: FONTS.sizes.md,
    lineHeight: 22,
  },

  messageTime: {
    fontSize: FONTS.sizes.xs,
    marginTop: SPACING.xs,
    textAlign: "right",
  },

  // --------------------------------------------------------
  // THINKING
  // --------------------------------------------------------

  loadingContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },

  loadingBubble: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
  },

  loadingText: {
    fontSize: FONTS.sizes.sm,
    fontStyle: "italic",
  },

  // --------------------------------------------------------
  // INPUT
  // --------------------------------------------------------

  inputContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    gap: SPACING.sm,
    borderTopWidth: 1,
  },

  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 25,
    fontSize: FONTS.sizes.md,
  },

  sendButton: {
    minWidth: 64,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },

  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  // --------------------------------------------------------
  // GUEST BAR
  // --------------------------------------------------------

  guestBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: 1,
  },

  guestTextContainer: {
    flex: 1,
    marginRight: 10,
  },

  guestTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },

  guestSubtitle: {
    fontSize: 11,
    lineHeight: 15,
  },

  guestButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
  },

  guestButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
  },

  faqContainer: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: 8,
  },

  faqButton: {
    width: "48%",
    minHeight: 42,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  faqText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
  },

  // --------------------------------------------------------
  // PWD ACCESSIBILITY VOICE-OVER STYLES
  // --------------------------------------------------------

  voiceModeToggle: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    gap: 6,
  },

  voiceModeText: {
    fontSize: 12,
    fontWeight: "700",
  },

  listeningBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    marginHorizontal: SPACING.md,
    marginBottom: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
  },

  listeningLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },

  pulsingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#EF4444",
  },

  listeningText: {
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },

  doneListeningBtn: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },

  doneListeningText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },

  micButtonActive: {
    transform: [{ scale: 1.08 }],
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },

  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.xs,
    gap: 8,
  },

  speakActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
    gap: 4,
  },

  speakActionText: {
    fontSize: 11,
    fontWeight: "700",
  },
});

export default AssistantScreen;
