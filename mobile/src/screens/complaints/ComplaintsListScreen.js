import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useFeedback } from '../../contexts/FeedbackContext';
import { Card, LoadingSpinner, EmptyState, StatusBadge } from '../../components/common/SharedComponents';
import ConfirmDialogModal from '../../components/common/ConfirmDialogModal';
import EditComplaintModal from './EditComplaintModal';
import { complaintsAPI } from '../../api/services';
import { FONTS, SPACING, RADIUS, SHADOWS, COMPLAINT_STATUS, COMPLAINT_CATEGORIES } from '../../utils/constants';
import { formatDate, formatDateTime } from '../../utils/helpers';

const FILTER_TABS = [
  { id: 'all', label: 'All History', icon: 'history' },
  { id: 'active', label: 'In Progress', icon: 'clock-outline' },
  { id: 'resolved', label: 'Resolved', icon: 'check-circle-outline' },
  { id: 'archived', label: 'Archived', icon: 'archive-outline' },
  { id: 'deleted', label: 'Trash', icon: 'trash-can-outline' },
];

const getStepProgress = (complaint) => {
  if (complaint.status === 'deleted') {
    return { step: 0, label: 'Report Deleted / Cancelled', percent: 0, color: '#EF4444' };
  }
  if (complaint.isArchived) {
    return { step: 0, label: 'Report Archived', percent: 100, color: '#F59E0B' };
  }
  switch (complaint.status) {
    case 'pending':
      return { step: 1, label: 'Report Received (In Progress)', percent: 25, color: '#3B82F6' };
    case 'under_review':
      return { step: 2, label: 'Under Operator Review (In Progress)', percent: 50, color: '#0284C7' };
    case 'endorsed_to_lgu':
      return { step: 3, label: 'Endorsed to Dagupan LGU', percent: 75, color: '#0284C7' };
    case 'action_taken':
      return { step: 4, label: 'Official Action Taken', percent: 90, color: '#059669' };
    case 'terminated':
    case 'resolved':
      return { step: 4, label: 'Case Resolved & Closed', percent: 100, color: '#10B981' };
    case 'dismissed':
      return { step: 4, label: 'Dismissed', percent: 100, color: '#6B7280' };
    default:
      return { step: 1, label: 'Report Received', percent: 25, color: '#3B82F6' };
  }
};

const ComplaintsListScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { showSuccess, showError, showWarning } = useFeedback();

  const [complaints, setComplaints] = useState([]);
  const [counts, setCounts] = useState({ all: 0, active: 0, resolved: 0, archived: 0, deleted: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [editModalData, setEditModalData] = useState({ visible: false, complaint: null });
  const [confirmDialog, setConfirmDialog] = useState({
    visible: false,
    type: 'danger',
    title: '',
    message: '',
    confirmText: 'Confirm',
    onConfirm: () => {},
  });

  // Undo Snack Banner state
  const [undoBanner, setUndoBanner] = useState({
    visible: false,
    message: '',
    complaintId: null,
    actionType: '', // 'deleted' | 'archived'
  });
  const undoTimeoutRef = useRef(null);

  const loadComplaints = async (tabToLoad = activeTab) => {
    try {
      const { data } = await complaintsAPI.getMyComplaints({
        tab: tabToLoad,
        search: searchQuery.trim() || undefined,
      });

      const list = data?.data || data?.complaints || [];
      setComplaints(list);
      if (data?.counts) {
        setCounts(data.counts);
      }
    } catch (e) {
      console.log('Failed to load complaints:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints(activeTab);
  }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadComplaints(activeTab);
    setRefreshing(false);
  };

  const handleSearchSubmit = () => {
    loadComplaints(activeTab);
  };

  const triggerUndoBanner = (complaintId, message, actionType) => {
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    setUndoBanner({
      visible: true,
      message,
      complaintId,
      actionType,
    });
    undoTimeoutRef.current = setTimeout(() => {
      setUndoBanner((prev) => ({ ...prev, visible: false }));
    }, 6000);
  };

  // Action handlers
  const handleUndo = async (complaintId) => {
    const idToUndo = complaintId || undoBanner.complaintId;
    if (!idToUndo) return;

    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    setUndoBanner((prev) => ({ ...prev, visible: false }));

    try {
      const { data } = await complaintsAPI.undoMyComplaint(idToUndo);
      showSuccess('Action Undone', data.message || 'Report restored successfully!');
      loadComplaints(activeTab);
    } catch (err) {
      showError('Undo Failed', err.response?.data?.message || 'Could not undo action.');
    }
  };

  const handleArchive = async (item) => {
    try {
      await complaintsAPI.archiveMyComplaint(item._id);
      showSuccess('Report Archived', 'Report moved to archive history.');
      triggerUndoBanner(item._id, 'Report was archived.', 'archived');
      loadComplaints(activeTab);
    } catch (err) {
      showError('Archive Failed', err.response?.data?.message || 'Could not archive report.');
    }
  };

  const handleUnarchive = async (item) => {
    try {
      await complaintsAPI.unarchiveMyComplaint(item._id);
      showSuccess('Report Unarchived', 'Report restored to active history.');
      loadComplaints(activeTab);
    } catch (err) {
      showError('Unarchive Failed', err.response?.data?.message || 'Could not unarchive report.');
    }
  };

  const promptDelete = (item) => {
    setConfirmDialog({
      visible: true,
      type: 'danger',
      title: 'Delete / Cancel Report?',
      message: `Are you sure you want to remove report "${item.subject}"? You can undo or restore it at any time from the Trash tab.`,
      confirmText: 'Delete Report',
      onConfirm: async () => {
        setConfirmDialog((p) => ({ ...p, visible: false }));
        try {
          await complaintsAPI.deleteMyComplaint(item._id);
          showSuccess('Report Deleted', 'Report moved to Trash history.');
          triggerUndoBanner(item._id, 'Report was deleted.', 'deleted');
          loadComplaints(activeTab);
        } catch (err) {
          showError('Delete Failed', err.response?.data?.message || 'Could not delete report.');
        }
      },
    });
  };

  const filteredComplaints = useMemo(() => {
    if (!searchQuery.trim()) return complaints;
    const query = searchQuery.toLowerCase().trim();
    return complaints.filter((item) => {
      const matchSubject = item.subject?.toLowerCase().includes(query);
      const matchCase = item.lguCaseNumber?.toLowerCase().includes(query);
      const matchPlate = item.vehiclePlateNumber?.toLowerCase().includes(query);
      const matchCategory = item.category?.toLowerCase().includes(query);
      return matchSubject || matchCase || matchPlate || matchCategory;
    });
  }, [complaints, searchQuery]);

  if (loading) {
    return <LoadingSpinner text="Loading complaints history..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Edit Complaint Modal */}
      <EditComplaintModal
        visible={editModalData.visible}
        complaint={editModalData.complaint}
        onClose={() => setEditModalData({ visible: false, complaint: null })}
        onSuccess={() => loadComplaints(activeTab)}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialogModal
        visible={confirmDialog.visible}
        type={confirmDialog.type}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        onClose={() => setConfirmDialog((p) => ({ ...p, visible: false }))}
        onConfirm={confirmDialog.onConfirm}
      />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Complaints History & Monitor
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Review past grievances, edit in-progress cases & restore updates
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
          <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{counts.all || 0}</Text>
          <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Total Active</Text>
        </View>
        <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.metricValue, { color: '#0284c7' }]}>{counts.active || 0}</Text>
          <Text style={[styles.metricLabel, { color: colors.textMuted }]}>In Progress</Text>
        </View>
        <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.metricValue, { color: '#059669' }]}>{counts.resolved || 0}</Text>
          <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Resolved</Text>
        </View>
        <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.metricValue, { color: '#F59E0B' }]}>{counts.archived || 0}</Text>
          <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Archived</Text>
        </View>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search history by case #, plate, or subject..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
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
            const countForTab = counts[item.id] !== undefined ? counts[item.id] : null;

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
                <MaterialCommunityIcons
                  name={item.icon}
                  size={14}
                  color={isSelected ? '#FFFFFF' : colors.textSecondary}
                  style={{ marginRight: 4 }}
                />
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
                  {countForTab !== null ? ` (${countForTab})` : ''}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Floating Undo Snackbar Banner */}
      {undoBanner.visible && (
        <View style={styles.undoFloatingBar}>
          <MaterialCommunityIcons name="information" size={18} color="#FFFFFF" />
          <Text style={styles.undoFloatingText}>{undoBanner.message}</Text>
          <TouchableOpacity
            style={styles.undoFloatingBtn}
            onPress={() => handleUndo(undoBanner.complaintId)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="undo" size={16} color="#FBBF24" />
            <Text style={styles.undoFloatingBtnText}>UNDO</Text>
          </TouchableOpacity>
        </View>
      )}

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
            icon={
              activeTab === 'archived'
                ? 'archive-outline'
                : activeTab === 'deleted'
                ? 'trash-can-outline'
                : 'clipboard-search-outline'
            }
            title={
              activeTab === 'archived'
                ? 'No archived reports'
                : activeTab === 'deleted'
                ? 'Trash is empty'
                : Boolean(searchQuery)
                ? 'No matching reports'
                : 'No reports found'
            }
            message={
              activeTab === 'archived'
                ? 'Reports you archive to clean up your dashboard will appear here.'
                : activeTab === 'deleted'
                ? 'Cancelled or deleted reports will be kept here with full undo capability.'
                : 'Your complaint history and official Dagupan LGU status will be displayed here.'
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
          const progress = getStepProgress(item);

          // Rules evaluation
          const isInProgress = ['pending', 'under_review'].includes(item.status);
          const isArchived = Boolean(item.isArchived);
          const isDeleted = item.status === 'deleted';
          const canEdit = isInProgress && !isArchived && !isDeleted;

          return (
            <View style={{ marginBottom: SPACING.md }}>
              <Card style={styles.cardOverride}>
                {/* Header Case Tag & Status */}
                <View style={styles.cardHeaderRow}>
                  {Boolean(item.lguCaseNumber) ? (
                    <View style={styles.caseTag}>
                      <MaterialCommunityIcons name="shield-check" size={14} color="#0284c7" />
                      <Text style={styles.caseTagText}>{item.lguCaseNumber}</Text>
                    </View>
                  ) : (
                    <View style={[styles.caseTag, { backgroundColor: 'rgba(100, 116, 139, 0.12)' }]}>
                      <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textMuted} />
                      <Text style={[styles.caseTagText, { color: colors.textMuted }]}>Pending Case #</Text>
                    </View>
                  )}

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {isArchived && (
                      <View style={styles.archivePill}>
                        <MaterialCommunityIcons name="archive" size={11} color="#F59E0B" />
                        <Text style={styles.archivePillText}>Archived</Text>
                      </View>
                    )}
                    {isDeleted && (
                      <View style={styles.deletedPill}>
                        <MaterialCommunityIcons name="trash-can" size={11} color="#EF4444" />
                        <Text style={styles.deletedPillText}>Deleted</Text>
                      </View>
                    )}
                    <StatusBadge
                      label={isDeleted ? 'Deleted' : isArchived ? 'Archived' : status.label}
                      color={isDeleted ? '#EF4444' : isArchived ? '#F59E0B' : status.color}
                      bgColor={isDeleted ? 'rgba(239, 68, 68, 0.15)' : isArchived ? 'rgba(245, 158, 11, 0.15)' : status.bgColor}
                    />
                  </View>
                </View>

                {/* Subject & Category */}
                <TouchableOpacity
                  onPress={() => navigation.navigate('ComplaintDetail', { complaint: item, complaintId: item._id })}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.cardSubject, { color: colors.textPrimary }]} numberOfLines={2}>
                    {item.subject}
                  </Text>
                </TouchableOpacity>

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

                {/* Step / Status Note */}
                <View
                  style={[
                    styles.statusNoticeBox,
                    {
                      backgroundColor: isDeleted
                        ? 'rgba(239, 68, 68, 0.08)'
                        : isArchived
                        ? 'rgba(245, 158, 11, 0.08)'
                        : isDark
                        ? 'rgba(255,255,255,0.04)'
                        : '#F8FAFC',
                      borderColor: isDeleted
                        ? 'rgba(239, 68, 68, 0.2)'
                        : isArchived
                        ? 'rgba(245, 158, 11, 0.2)'
                        : colors.border,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={isDeleted ? 'alert-circle' : isArchived ? 'archive-outline' : canEdit ? 'pencil-circle' : 'shield-account'}
                    size={16}
                    color={isDeleted ? '#EF4444' : isArchived ? '#F59E0B' : canEdit ? '#0284C7' : colors.primary}
                  />
                  <Text
                    style={[
                      styles.statusNoticeText,
                      {
                        color: isDeleted
                          ? '#EF4444'
                          : isArchived
                          ? '#D97706'
                          : colors.textSecondary,
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {isDeleted
                      ? 'Removed report (Read-only). Tap Undo / Restore to re-activate this report.'
                      : isArchived
                      ? 'Archived report (Read-only). Unarchive to edit or manage active tracking.'
                      : canEdit
                      ? 'In Progress: You can edit or correct details before Dagupan LGU takes action.'
                      : item.lguActionNotes
                      ? `LGU Action: ${item.lguActionNotes}`
                      : `Escalated to Dagupan POSO for administrative review.`}
                  </Text>
                </View>

                {/* Action Bar (Edit, Archive, Delete, Undo) */}
                <View style={styles.actionsBar}>
                  {/* EDIT BUTTON (Only allowed when In Progress and not archived/deleted) */}
                  {canEdit ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, { borderColor: '#0284C7', backgroundColor: 'rgba(2, 132, 199, 0.08)' }]}
                      onPress={() => setEditModalData({ visible: true, complaint: item })}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="pencil-outline" size={15} color="#0284C7" />
                      <Text style={[styles.actionBtnText, { color: '#0284C7' }]}>Edit</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.actionBtn, styles.disabledActionBtn]}>
                      <MaterialCommunityIcons name="pencil-off-outline" size={14} color={colors.textMuted} />
                      <Text style={[styles.actionBtnText, { color: colors.textMuted }]}>Locked</Text>
                    </View>
                  )}

                  {/* ARCHIVE / UNARCHIVE BUTTON */}
                  {!isDeleted && (
                    isArchived ? (
                      <TouchableOpacity
                        style={[styles.actionBtn, { borderColor: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.08)' }]}
                        onPress={() => handleUnarchive(item)}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons name="archive-arrow-up-outline" size={15} color="#F59E0B" />
                        <Text style={[styles.actionBtnText, { color: '#F59E0B' }]}>Unarchive</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[styles.actionBtn, { borderColor: colors.border }]}
                        onPress={() => handleArchive(item)}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons name="archive-outline" size={15} color={colors.textSecondary} />
                        <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>Archive</Text>
                      </TouchableOpacity>
                    )
                  )}

                  {/* DELETE / CANCEL BUTTON */}
                  {!isDeleted ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, { borderColor: 'rgba(239, 68, 68, 0.3)' }]}
                      onPress={() => promptDelete(item)}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={15} color="#EF4444" />
                      <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Delete</Text>
                    </TouchableOpacity>
                  ) : null}

                  {/* UNDO / RESTORE BUTTON (For deleted reports) */}
                  {isDeleted ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, { borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}
                      onPress={() => handleUndo(item._id)}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="undo-variant" size={16} color="#10B981" />
                      <Text style={[styles.actionBtnText, { color: '#10B981', fontWeight: '800' }]}>Undo / Restore</Text>
                    </TouchableOpacity>
                  ) : null}

                  {/* VIEW DETAILS LINK */}
                  <TouchableOpacity
                    style={[styles.viewDetailsBtn, { marginLeft: 'auto' }]}
                    onPress={() => navigation.navigate('ComplaintDetail', { complaint: item, complaintId: item._id })}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.viewDetailsText, { color: colors.primary }]}>Timeline</Text>
                    <MaterialCommunityIcons name="chevron-right" size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </Card>
            </View>
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
    gap: 8,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  metricCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  tabChipText: {
    fontSize: FONTS.sizes.xs,
  },
  undoFloatingBar: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: '#0F172A',
    borderRadius: RADIUS.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 999,
    ...SHADOWS.lg,
    borderWidth: 1,
    borderColor: '#334155',
  },
  undoFloatingText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  undoFloatingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
  undoFloatingBtnText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: 60,
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
  archivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  archivePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  deletedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  deletedPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EF4444',
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
    marginBottom: 10,
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
  statusNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: 10,
  },
  statusNoticeText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
    paddingTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  disabledActionBtn: {
    borderColor: 'transparent',
    opacity: 0.6,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 5,
  },
  viewDetailsText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

export default ComplaintsListScreen;
