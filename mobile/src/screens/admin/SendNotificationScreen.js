import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { notificationsAPI } from '../../api/services';
import { FONTS, SPACING } from '../../utils/constants';

const SendNotificationScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Error', 'Title and message are required');
      return;
    }
    setLoading(true);
    try {
      await notificationsAPI.broadcast({ title, message, type: 'broadcast' });
      Alert.alert('Success', 'Notification sent to all commuters', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to send');
    }
    setLoading(false);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Send Notification</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Broadcast a message to all commuters
        </Text>

        <Input label="Title" placeholder="Notification title" value={title}
          onChangeText={setTitle} leftIcon="format-title" />
        <Input label="Message" placeholder="Write your message..." value={message}
          onChangeText={setMessage} leftIcon="text" multiline numberOfLines={4} />
        <Button title="Send Broadcast" onPress={handleSend} loading={loading} size="lg"
          icon={<MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />} />
      </View>
    </ScrollView>
  );
};

import { MaterialCommunityIcons } from '@expo/vector-icons';

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.xxl },
  title: { fontSize: FONTS.sizes.xxl, fontWeight: '800' },
  subtitle: { fontSize: FONTS.sizes.sm, marginTop: SPACING.xs, marginBottom: SPACING.xxl },
});

export default SendNotificationScreen;
