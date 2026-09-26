import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Card, LoadingSpinner, EmptyState, StatusBadge } from '../../components/common/SharedComponents';
import { complaintsAPI } from '../../api/services';
import { FONTS, SPACING, RADIUS, SHADOWS, COMPLAINT_STATUS, COMPLAINT_CATEGORIES } from '../../utils/constants';
import { formatDate, formatDateTime } from '../../utils/helpers';

const FILTER_TABS = [
  { id: 'all', label: 'All Reports' },
  { id: 'active', label: 'In Progress' },
  { id: 'action', label: 'Action Taken' },
  { id: 'resolved', label: 'Resolved' },
];

const getStepProgress = (status) => {
  switch (status) {
    case 'pending':
      return { step: 1, label: 'Report Received', percent: 25 };
    case 'under_review':
      return { step: 2, label: 'Under Operator Review', percent: 50 };
    case 'endorsed_to_lgu':
      return { step: 3, label: 'Endorsed to Dagupan LGU', percent: 75 };
    case 'action_taken':
      return { step: 4, label: 'Official Action Taken', percent: 90 };
    case 'terminated':
    case 'resolved':
      return { step: 4, label: 'Case Resolved & Closed', percent: 100 };
    case 'dismissed':
      return { step: 4, label: 'Dismissed', percent: 100 };
    default:
      return { step: 1, label: 'Report Received', percent: 25 };
  }
};

const ComplaintsListScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadComplaints = async () => {
    try {
      const { data } = await complaintsAPI.getMyComplaints();
      const list = data?.data || data?.complaints || [];
      setComplaints(list);
    } catch (e) {
      console.log('Failed to load complaints:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadComplaints();
    setRefreshing(false);
  };

  // Metrics computation
  const metrics = useMemo(() => {
    const total = complaints.length;
    const active = complaints.filter((c) =>
      ['pending', 'under_review', 'endorsed_to_lgu'].includes(c.status)
    ).length;
    const actionTaken = complaints.filter((c) => c.status === 'action_taken').length;
    const resolved = complaints.filter((c) =>
      ['terminated', 'resolved'].includes(c.status)
    ).length;
    return { total, active, actionTaken, resolved };
  }, [complaints]);

  // Filtered and searched list
  const filteredComplaints = useMemo(() => {
    return complaints.filter((item) => {
      // Tab filter
      if (activeTab === 'active') {
        if (!['pending', 'under_review', 'endorsed_to_lgu'].includes(item.status)) return false;
      } else if (activeTab === 'action') {
        if (item.status !== 'action_taken') return false;
      } else if (activeTab === 'resolved') {
        if (!['terminated', 'resolved'].includes(item.status)) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchSubject = item.subject?.toLowerCase().includes(query);
        const matchCase = item.lguCaseNumber?.toLowerCase().includes(query);
        const matchPlate = item.vehiclePlateNumber?.toLowerCase().includes(query);
        const matchCategory = item.category?.toLowerCase().includes(query);
        if (!matchSubject && !matchCase && !matchPlate && !matchCategory) return false;
      }

      return true;
    });
  }, [complaints, activeTab, searchQuery]);

  if (loading) {
    return <LoadingSpinner text="Loading your report monitor..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Report Monitor
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Track Dagupan LGU investigation & resolution status
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.newBtn, { backgroundColor: '#EF4444' }]}
          onPress={() => navigation.navigate('SubmitComplaint')}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
          <Text style={styles.newBtnText}>New Report</Text>
        </TouchableOpacity>
      </View>

      {/* KPI Status Summary Cards */}
      <View style={styles.metricsRow}>
        <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{metrics.total}</Text>
          <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Total Filed</Text>
        </View>
        <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.metricValue, { color: '#0284c7' }]}>{metrics.active}</Text>
          <Text style={[styles.metricLabel, { color: colors.textMuted }]}>In Progress</Text>
        </View>
        <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.metricValue, { color: '#059669' }]}>{metrics.actionTaken + metrics.resolved}</Text>
          <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Action/Resolved</Text>
        </View>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search by case #, plate number, or subject..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {Boolean(searchQuery) ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTER_TABS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.tabsContent}
          renderItem={({ item }) => {
            const isSelected = activeTab === item.id;
            return (
              <TouchableOpacity
                style={[
                  styles.tabChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setActiveTab(item.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabChipText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Complaints List */}
      <FlatList
        data={filteredComplaints}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="clipboard-search-outline"
            title={Boolean(searchQuery) ? 'No matching reports' : 'No reports in this category'}
            message={
              Boolean(searchQuery)
                ? 'Try searching with a different case number, plate, or subject.'
                : 'Reports you submit to Dagupan LGU will appear here with live updates.'
            }
          />
        }
        renderItem={({ item }) => {
          const status = COMPLAINT_STATUS[item.status] || {
            label: item.status,
            color: '#64748B',
            bgColor: 'rgba(100, 116, 139, 0.15)',
          };
          const cat = COMPLAINT_CATEGORIES.find((c) => c.value === item.category);
          const progress = getStepProgress(item.status);

          // Latest investigation snippet
          let latestNote = '';
          if (item.lguTerminationNotes) {
            latestNote = `Closed: ${item.lguTerminationNotes}`;
          } else if (item.lguActionNotes) {
            latestNote = `Action: ${item.lguActionNotes}`;
          } else if (item.adminNotes) {
            latestNote = `Operator: ${item.adminNotes}`;
          } else if (item.lguCaseNumber) {
            latestNote = `Case escalated to Dagupan POSO for official inquiry.`;
          } else {
            latestNote = `Awaiting transport dispatch verification.`;
          }

          return (
            <TouchableOpacity
              onPress={() => navigation.navigate('ComplaintDetail', { complaint: item, complaintId: item._id })}
              activeOpacity={0.88}
              style={{ marginBottom: SPACING.md }}
            >
              <Card style={styles.cardOverride}>
                {/* Case Bar */}
                <View style={styles.cardHeaderRow}>
                  {Boolean(item.lguCaseNumber) ? (
                    <View style={styles.caseTag}>
                      <MaterialCommunityIcons name="shield-check" size={14} color="#0284c7" />
                      <Text style={styles.caseTagText}>{item.lguCaseNumber}</Text>
                    </View>
                  ) : (
                    <View style={[styles.caseTag, { backgroundColor: 'rgba(100, 116, 139, 0.12)' }]}>
                      <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textMuted} />
                      <Text style={[styles.caseTagText, { color: colors.textMuted }]}>Pending LGU Case #</Text>
                    </View>
                  )}

                  <StatusBadge
                    label={status.label}
                    color={status.color}
                    bgColor={status.bgColor}
                  />
                </View>

                {/* Subject & Category */}
                <Text style={[styles.cardSubject, { color: colors.textPrimary }]} numberOfLines={2}>
                  {item.subject}
                </Text>

                <View style={styles.cardMetaRow}>
                  <View style={styles.catPill}>
                    <MaterialCommunityIcons name={cat?.icon || 'alert-circle'} size={14} color={colors.textSecondary} />
                    <Text style={[styles.catPillText, { color: colors.textSecondary }]}>
                      {cat?.label || item.category}
                    </Text>
                  </View>

                  {Boolean(item.vehiclePlateNumber) ? (
                    <View style={styles.platePill}>
                      <MaterialCommunityIcons name="car" size={13} color="#D97706" />
                      <Text style={styles.platePillText}>{item.vehiclePlateNumber}</Text>
                    </View>
                  ) : null}

                  <Text style={[styles.cardDate, { color: colors.textMuted }]}>
                    {formatDate(item.createdAt)}
                  </Text>
                </View>

                {/* Visual Step Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressLabelRow}>
                    <Text style={[styles.progressStatusText, { color: colors.textPrimary }]}>
                      Step {progress.step} of 4: {progress.label}
                    </Text>
                    <Text style={[styles.progressPercentText, { color: colors.primary }]}>
                      {progress.percent}%
                    </Text>
                  </View>

                  <View style={[styles.progressBarTrack, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${progress.percent}%`,
                          backgroundColor:
                            progress.percent === 100
                              ? '#10B981'
                              : progress.percent >= 75
                              ? '#0284C7'
                              : colors.primary,
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Latest Update Snippet */}
                <View style={[styles.latestNoteBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC' }]}>
                  <MaterialCommunityIcons
                    name={item.lguActionNotes ? 'bullhorn' : 'information-outline'}
                    size={16}
                    color={item.lguActionNotes ? '#10B981' : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.latestNoteText,
                      { color: item.lguActionNotes ? (isDark ? '#34D399' : '#047857') : colors.textSecondary },
                    ]}
                    numberOfLines={2}
                  >
                    {latestNote}
                  </Text>
                </View>

                {/* Footer Action Row */}
                <View style={styles.cardFooter}>
                  <Text style={[styles.trackLinkText, { color: colors.primary }]}>
                    View Investigation Timeline & Evidence
                  </Text>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={colors.primary} />
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    ...SHADOWS.sm,
  },
  newBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: FONTS.sizes.xs,
  },
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    gap: 10,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  metricCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  searchContainer: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    paddingVertical: 0,
  },
  tabsWrapper: {
    marginBottom: SPACING.md,
  },
  tabsContent: {
    paddingHorizontal: SPACING.xl,
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  tabChipText: {
    fontSize: FONTS.sizes.xs,
  },
  listContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: 40,
  },
  cardOverride: {
    padding: 14,
    borderRadius: RADIUS.lg,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  caseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  caseTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284c7',
  },
  cardSubject: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 8,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  catPillText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '500',
  },
  platePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  platePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
    fontFamily: 'monospace',
  },
  cardDate: {
    fontSize: 11,
    marginLeft: 'auto',
  },
  progressContainer: {
    marginBottom: 10,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressPercentText: {
    fontSize: 11,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  latestNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: RADIUS.md,
    marginBottom: 10,
  },
  latestNoteText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
    paddingTop: 8,
  },
  trackLinkText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default ComplaintsListScreen;
