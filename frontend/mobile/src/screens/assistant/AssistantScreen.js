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

  const [faqs] = useState([
    "What are the current jeepney fares?",
    "How can I check a jeepney route?",
    "How do I report a transport complaint?",
    "What are my rights as a commuter?",
  ]);

  const flatListRef = useRef(null);

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
  // SEND MESSAGE
  // --------------------------------------------------

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    setShowFAQs(false);

    const userMsg = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);

    const messageToSend = input.trim();
    setInput("");
    setLoading(true);

    try {
      const { data } = await assistantAPI.chat({
        message: messageToSend,
        sessionId,
      });

      setSessionId(data.data?.sessionId || sessionId);

      const assistantMsg = {
        role: "assistant",
        content:
          data.data?.response ||
          data.data?.message ||
          "I apologize, I could not process that request.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I'm having trouble connecting right now. Please try again later.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // CLEAR CHAT
  // --------------------------------------------------

  const clearChat = () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Are you sure you want to delete all of your chat history? This cannot be undone.",
      );

      if (!confirmed) return;

      performClearHistory();
    } else {
      Alert.alert(
        "Clear Chat History",
        "Are you sure you want to delete all of your chat history? This cannot be undone.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: performClearHistory,
          },
        ],
      );
    }
  };

  const performClearHistory = async () => {
    try {
      await assistantAPI.clearHistory();

      setMessages([]);
      setSessionId(null);
      setChatHistory([]);
      setShowFAQs(true);
    } catch (error) {
      console.log("Clear history error:", error);

      if (Platform.OS === "web") {
        window.alert(
          "Unable to Clear History\n\nSomething went wrong while clearing your chat history.",
        );
      } else {
        Alert.alert(
          "Unable to Clear History",
          "Something went wrong while clearing your chat history.",
        );
      }
    }
  };

  const handleFAQ = async (question) => {
    if (loading) return;

    setShowFAQs(false);

    const userMsg = {
      role: "user",
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const { data } = await assistantAPI.chat({
        message: question,
        sessionId,
      });

      setSessionId(data.data?.sessionId || sessionId);

      const assistantMsg = {
        role: "assistant",
        content:
          data.data?.response ||
          data.data?.message ||
          "I apologize, I could not process that request.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I'm having trouble connecting right now. Please try again later.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (selectedSessionId) => {
    try {
      setHistoryLoading(true);

      const { data } = await assistantAPI.getHistory(selectedSessionId);

      const historyMessages = data.data?.messages || [];

      setSessionId(selectedSessionId);
      setMessages(historyMessages);
      setShowFAQs(false);
      setHistoryVisible(false);
    } catch (error) {
      console.log("Failed to load conversation:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === "user";

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

            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: colors.surface,
                  borderTopColor: colors.border,
                },
              ]}
            >
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder="Type your message..."
                placeholderTextColor={colors.textMuted}
                value={input}
                onChangeText={setInput}
                multiline
                editable={!loading}
                onSubmitEditing={sendMessage}
              />

              <TouchableOpacity
                onPress={sendMessage}
                disabled={!input.trim() || loading}
                style={[
                  styles.sendButton,
                  {
                    backgroundColor: input.trim()
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
});

export default AssistantScreen;
