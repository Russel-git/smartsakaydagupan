import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { notificationsAPI } from '../../api/services';
import { FONTS, SPACING, RADIUS } from '../../utils/constants';

const NOTIF_CATEGORIES = [
  {
    id: 'broadcast_by_admin',
    type: 'broadcast',
    label: 'Broadcast by Admin',
    icon: 'bullhorn-variant',
    color: '#EA580C',
    bg: '#FFEDD5',
    desc: 'Public transit advisory or city announcement',
  },
  {
    id: 'weather_updates',
    type: 'weather_alert',
    label: 'Weather Updates',
    icon: 'weather-partly-rainy',
    color: '#0284C7',
    bg: '#E0F2FE',
    desc: 'Rainfall, typhoon warning, flood bulletin',
  },
  {
    id: 'complaint_updates',
    type: 'complaint_update',
    label: 'Complaint Updates',
    icon: 'scale-balance',
    color: '#7C3AED',
    bg: '#EDE9FE',
    desc: 'POSO grievance update or resolution',
  },
];

const SendNotificationScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const [selectedCat, setSelectedCat] = useState(NOTIF_CATEGORIES[0]);
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
      await notificationsAPI.broadcast({
        title: title.trim(),
        message: message.trim(),
        type: selectedCat.type,
        category: selectedCat.id,
      });
      Alert.alert('Success', `Notification dispatched under "${selectedCat.label}" category to all commuters.`, [
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
          Broadcast a categorized advisory to all commuters
        </Text>

        {/* Category Picker */}
        <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Select Notification Category</Text>
        <View style={styles.categoryGrid}>
          {NOTIF_CATEGORIES.map((cat) => {
            const isSelected = selectedCat.id === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCat(cat)}
                activeOpacity={0.8}
                style={[
                  styles.catOption,
                  {
                    backgroundColor: isSelected
                      ? isDark
                        ? cat.color + '22'
                        : cat.bg
                      : isDark
                      ? 'rgba(255,255,255,0.04)'
                      : colors.surface,
                    borderColor: isSelected ? cat.color : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
              >
                <View style={[styles.catIconWrap, { backgroundColor: cat.color + '25' }]}>
                  <MaterialCommunityIcons name={cat.icon} size={20} color={cat.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.catTitle,
                      { color: isSelected ? cat.color : colors.textPrimary },
                    ]}
                  >
                    {cat.label}
                  </Text>
                  <Text style={[styles.catDesc, { color: colors.textSecondary }]}>
                    {cat.desc}
                  </Text>
                </View>
                {isSelected && (
                  <MaterialCommunityIcons name="check-circle" size={18} color={cat.color} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Input
          label="Title"
          placeholder="Notification title"
          value={title}
          onChangeText={setTitle}
          leftIcon="format-title"
        />
        <Input
          label="Message"
          placeholder="Write your message..."
          value={message}
          onChangeText={setMessage}
          leftIcon="text"
          multiline
          numberOfLines={4}
        />
        <Button
          title={`Send Broadcast as ${selectedCat.label}`}
          onPress={handleSend}
          loading={loading}
          size="lg"
          icon={<MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.xl },
  title: { fontSize: FONTS.sizes.xxl, fontWeight: '800' },
  subtitle: { fontSize: FONTS.sizes.sm, marginTop: SPACING.xs, marginBottom: SPACING.lg },
  sectionLabel: { fontSize: FONTS.sizes.sm, fontWeight: '700', marginBottom: SPACING.sm },
  categoryGrid: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  catOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    gap: 12,
  },
  catIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '800',
  },
  catDesc: {
    fontSize: 11,
    marginTop: 2,
  },
});

export default SendNotificationScreen;
