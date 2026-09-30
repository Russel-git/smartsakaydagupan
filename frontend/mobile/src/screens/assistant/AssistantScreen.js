import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/common/Input';
import AuthPromptModal from '../../components/common/AuthPromptModal';
import { assistantAPI } from '../../api/services';
import { FONTS, SPACING, RADIUS } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';

const AssistantScreen = () => {
  const { colors, isDark } = useTheme();
  const { isGuest } = useAuth();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;

  const topInset = Platform.OS === 'android'
    ? Math.max(insets.top, StatusBar.currentHeight || 28)
    : insets.top;

  const [promptVisible, setPromptVisible] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Kumusta! I am your Smart Sakay Dagupan AI Assistant.\n\n• Magtanong tungkol sa ruta ng jeep, signboards, o pamasahe\n• Live weather & tidal flood watch sa kalsada\n• Solo ride / visitor fare estimates at commuter rights\n\nSaan po ang inyong sakayan at bababaan?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);

  const QUICK_PROMPTS = [
    { label: '🛒 Papunta CSI Lucao', text: 'paano pumunta sa csi lucao? ano sasakyan kong jeep?' },
    { label: '⚠️ Paano mag-report?', text: 'paano magrereport kapag overcharging o may reklamo sa jeep o solo ride?' },
    { label: '🚌 Bus sa Perez Blvd', text: 'saan papunta kapag sumakay ng bus sa Perez Boulevard?' },
    { label: '🚗 Solo Ride Fares', text: 'magkano pamasahe sa solo ride / visitor sa Dagupan City?' },
  ];

  const handleSendText = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await assistantAPI.chat({ message: text });
      const assistantMsg = {
        role: 'assistant',
        content: data.data?.response || data.data?.message || 'I apologize, I could not process that request.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I\'m having trouble connecting right now. Please try again later.',
          timestamp: new Date(),
        },
      ]);
    }
    setLoading(false);
  };

  const sendMessage = () => handleSendText(input);

  const clearChat = async () => {
    try {
      await assistantAPI.clearHistory();
    } catch (e) { /* */ }
    setMessages([{
      role: 'assistant',
      content: 'Chat cleared. How can I help you?',
      timestamp: new Date(),
    }]);
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
        {!isUser && (
          <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
            <MaterialCommunityIcons name="robot" size={18} color={colors.primary} />
          </View>
        )}
        <View
          style={[
            styles.bubble,
            isUser
              ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
              : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderBottomLeftRadius: 4 },
          ]}
        >
          <Text style={[styles.msgText, { color: isUser ? '#FFFFFF' : colors.textPrimary }]}>
            {item.content}
          </Text>
          <Text style={[styles.msgTime, { color: isUser ? 'rgba(255,255,255,0.6)' : colors.textMuted }]}>
            {formatDate(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent={Platform.OS === 'android'}
      />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border, paddingTop: topInset + 8 }]}>
        <View style={[styles.headerInner, { maxWidth: isTablet ? 760 : '100%', alignSelf: 'center', width: '100%' }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.headerAvatar, { backgroundColor: colors.primary + '15' }]}>
              <MaterialCommunityIcons name="robot" size={24} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>AI Transit Assistant</Text>
              <Text style={[styles.headerStatus, { color: '#16A34A' }]}>● Online • Dagupan Guide</Text>
            </View>
          </View>
          <TouchableOpacity onPress={clearChat} style={styles.clearBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialCommunityIcons name="delete-outline" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Typing indicator */}
      {loading && (
        <View style={[styles.typingRow]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
            <MaterialCommunityIcons name="robot" size={18} color={colors.primary} />
          </View>
          <View style={[styles.typingBubble, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.typingText, { color: colors.textMuted }]}>Thinking...</Text>
          </View>
        </View>
      )}

      {/* Quick Suggestion Chips */}
      {!isGuest && (
        <View style={[styles.suggestionsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
            {QUICK_PROMPTS.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => handleSendText(item.text)}
                disabled={loading}
                style={[
                  styles.suggestionChip,
                  { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }
                ]}
              >
                <Text style={[styles.suggestionChipText, { color: colors.primary }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Input or Guest Locked Bar */}
      {isGuest ? (
        <View style={[styles.guestLockedBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={[styles.guestLockedTitle, { color: colors.textPrimary }]}>
              Account Required to Chat
            </Text>
            <Text style={[styles.guestLockedSubtitle, { color: colors.textSecondary }]}>
              Sign up for free to get 24/7 Dagupan transit and fare advice.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.guestSignUpBtn, { backgroundColor: colors.primary }]}
            onPress={() => setPromptVisible(true)}
          >
            <Text style={styles.guestSignUpBtnText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.inputBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.inputBarInner, { maxWidth: isTablet ? 760 : '100%', alignSelf: 'center', width: '100%' }]}>
            <Input
              placeholder="Ask me anything about commuting..."
              value={input}
              onChangeText={setInput}
              style={styles.inputField}
              multiline
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity
              onPress={sendMessage}
              disabled={!input.trim() || loading}
              style={[styles.sendBtn, { backgroundColor: input.trim() ? colors.primary : colors.border }]}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

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
  container: { flex: 1 },
  header: {
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderBottomWidth: 1,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700' },
  headerStatus: { fontSize: FONTS.sizes.xs, fontWeight: '600' },
  clearBtn: { padding: SPACING.sm },
  messagesList: { padding: SPACING.lg, paddingBottom: SPACING.sm },
  msgRow: { flexDirection: 'row', marginBottom: SPACING.md, alignItems: 'flex-end', gap: SPACING.sm },
  msgRowUser: { flexDirection: 'row-reverse' },
  avatar: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  bubble: { maxWidth: '78%', padding: SPACING.md, borderRadius: RADIUS.lg },
  msgText: { fontSize: FONTS.sizes.md, lineHeight: 22 },
  msgTime: { fontSize: FONTS.sizes.xs, marginTop: SPACING.xs, textAlign: 'right' },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  typingBubble: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1 },
  typingText: { fontSize: FONTS.sizes.sm },
  suggestionsContainer: { paddingVertical: 8, borderTopWidth: 1 },
  suggestionsScroll: { paddingHorizontal: SPACING.md, gap: 8 },
  suggestionChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1, minHeight: 36, justifyContent: 'center' },
  suggestionChipText: { fontSize: 12, fontWeight: '600' },
  inputBar: { borderTopWidth: 1, padding: SPACING.md },
  inputBarInner: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm },
  inputField: { flex: 1, marginBottom: 0 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  guestLockedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
  },
  guestLockedTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  guestLockedSubtitle: {
    fontSize: 11,
    lineHeight: 15,
  },
  guestSignUpBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
  },
  guestSignUpBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
});

export default AssistantScreen;
