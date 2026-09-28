import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  RefreshControl,
  Share,
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useFeedback } from '../../contexts/FeedbackContext';
import { Card, StatusBadge, Divider, LoadingSpinner } from '../../components/common/SharedComponents';
import ConfirmDialogModal from '../../components/common/ConfirmDialogModal';
import EditComplaintModal from './EditComplaintModal';
import { complaintsAPI } from '../../api/services';
import { FONTS, SPACING, RADIUS, SHADOWS, COMPLAINT_STATUS, COMPLAINT_CATEGORIES } from '../../utils/constants';
import { formatDate, formatDateTime } from '../../utils/helpers';

const ComplaintDetailScreen = ({ route: navRoute, navigation }) => {
  const initialComplaint = navRoute.params?.complaint;
  const complaintId = navRoute.params?.complaintId || initialComplaint?._id;

  const { colors, isDark } = useTheme();
  const { showSuccess, showError, showWarning } = useFeedback();

  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;

  const [complaint, setComplaint] = useState(initialComplaint || null);
  const [loading, setLoading] = useState(!initialComplaint);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Modals state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'danger',
    confirmText: 'Confirm',
    onConfirm: () => {},
  });

  const fetchFreshComplaint = async () => {
    if (!complaintId) return;
    try {
      const { data } = await complaintsAPI.getComplaintById(complaintId);
      if (data?.data) {
        setComplaint(data.data);
      }
    } catch (err) {
      console.log('Error fetching fresh complaint:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFreshComplaint();
  }, [complaintId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFreshComplaint();
  };

  const handleShareCase = async () => {
    if (!complaint) return;
    try {
      const caseRef = complaint.lguCaseNumber || `SMARTSAKAY-${complaint._id.slice(-6).toUpperCase()}`;
      await Share.share({
        title: `Dagupan Transit Case ${caseRef}`,
        message: `Dagupan City Transit Grievance Tracking\nCase Number: ${caseRef}\nSubject: ${complaint.subject}\nStatus: ${complaint.status}\nSubmitted: ${formatDate(complaint.createdAt)}`,
      });
    } catch (err) {
      console.log('Share error:', err.message);
    }
  };

  // Management actions: Edit, Archive, Unarchive, Delete & Undo
  const handleArchive = async () => {
    try {
      await complaintsAPI.archiveMyComplaint(complaint._id);
      showSuccess('Report Archived', 'Report moved to archive history.');
      fetchFreshComplaint();
    } catch (err) {
      showError('Archive Failed', err.response?.data?.message || 'Could not archive.');
    }
  };

  const handleUnarchive = async () => {
    try {
      await complaintsAPI.unarchiveMyComplaint(complaint._id);
      showSuccess('Report Restored', 'Report restored to active history.');
      fetchFreshComplaint();
    } catch (err) {
      showError('Unarchive Failed', err.response?.data?.message || 'Could not unarchive.');
    }
  };

  const promptDelete = () => {
    setConfirmDialog({
      visible: true,
      type: 'danger',
      title: 'Delete / Cancel Report?',
      message: 'Are you sure you want to remove this report? You can restore it at any time from the Trash history.',
      confirmText: 'Delete Report',
      onConfirm: async () => {
        setConfirmDialog((p) => ({ ...p, visible: false }));
        try {
          await complaintsAPI.deleteMyComplaint(complaint._id);
          showSuccess('Report Deleted', 'Report moved to Trash history.');
          fetchFreshComplaint();
        } catch (err) {
          showError('Delete Failed', err.response?.data?.message || 'Could not delete.');
        }
      },
    });
  };

  const handleUndo = async () => {
    try {
      await complaintsAPI.undoMyComplaint(complaint._id);
      showSuccess('Action Undone', 'Report restored successfully!');
      fetchFreshComplaint();
    } catch (err) {
      showError('Undo Failed', err.response?.data?.message || 'Could not restore report.');
    }
  };

  if (loading && !complaint) {
    return <LoadingSpinner text="Fetching official case timeline..." />;
  }

  if (!complaint) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.textMuted} />
        <Text style={[styles.notFoundTitle, { color: colors.textPrimary }]}>Case Record Not Found</Text>
        <Text style={[styles.notFoundSubtitle, { color: colors.textMuted }]}>
          This report may have been archived or is no longer accessible.
        </Text>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>Return to Reports</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isArchived = Boolean(complaint.isArchived);
  const isDeleted = complaint.status === 'deleted';
  const isInProgress = ['pending', 'under_review'].includes(complaint.status);
  const canEdit = isInProgress && !isArchived && !isDeleted;

  const status = COMPLAINT_STATUS[complaint.status] || {
    label: complaint.status,
    color: '#64748B',
    bgColor: 'rgba(100, 116, 139, 0.15)',
  };
  const cat = COMPLAINT_CATEGORIES.find((c) => c.value === complaint.category);
  const hasPhotos = complaint.attachments && complaint.attachments.length > 0;

  // Timeline calculation
  const isVerified = complaint.status !== 'pending' && !isDeleted;
  const isEndorsed = ['endorsed_to_lgu', 'action_taken', 'terminated', 'resolved'].includes(complaint.status);
  const isActionTaken = ['action_taken', 'terminated', 'resolved'].includes(complaint.status);
  const isClosed = ['terminated', 'resolved', 'dismissed'].includes(complaint.status);

  const timelineSteps = [
    {
      title: 'Report Submitted',
      subtitle: 'Commuter grievance recorded with evidence in SmartSakay.',
      date: complaint.createdAt,
      state: 'completed',
      icon: 'check-circle',
    },
    {
      title: 'Operator Review & Verification',
      subtitle: isVerified
        ? `Verified by ${complaint.verifiedBy ? `${complaint.verifiedBy.firstName} ${complaint.verifiedBy.lastName}` : 'Dagupan Transit Operations'}.`
        : 'Under initial review by transport dispatch.',
      date: complaint.lguEndorsedAt || (isVerified ? complaint.updatedAt : null),
      state: isVerified ? 'completed' : 'current',
      icon: isVerified ? 'check-circle' : 'progress-clock',
    },
    {
      title: 'Escalated to Dagupan LGU / POSO',
      subtitle: isEndorsed
        ? `Official Case #${complaint.lguCaseNumber || 'Assigned'} endorsed to City POSO.`
        : 'Awaiting escalation to Dagupan City Public Order & Safety Office.',
      date: complaint.lguEndorsedAt,
      state: isEndorsed ? 'completed' : isVerified ? 'current' : 'pending',
      icon: isEndorsed ? 'check-circle' : 'shield-alert-outline',
    },
    {
      title: 'Official LGU Action & Inquiry',
      subtitle: isActionTaken
        ? (complaint.lguActionNotes || 'Administrative inquiry conducted; operator/driver summoned.')
        : 'City inspectors investigating violation with transport cooperative.',
      date: complaint.lguActionTakenAt,
      state: isActionTaken ? 'completed' : isEndorsed ? 'current' : 'pending',
      icon: isActionTaken ? 'check-circle' : 'police-badge',
    },
    {
      title: 'Resolution & Case Closure',
      subtitle: isClosed
        ? (complaint.lguTerminationNotes || 'Grievance officially settled and case closed.')
        : 'Final compliance check and case conclusion.',
      date: complaint.lguTerminatedAt || complaint.resolvedAt,
      state: isClosed ? 'completed' : 'pending',
      icon: isClosed ? 'check-all' : 'flag-checkered',
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 50 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
    >
      {/* Edit Modal */}
      <EditComplaintModal
        visible={editModalVisible}
        complaint={complaint}
        onClose={() => setEditModalVisible(false)}
        onSuccess={() => fetchFreshComplaint()}
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

      <View style={[styles.content, { maxWidth: isTablet ? 740 : '100%', alignSelf: 'center', width: '100%' }]}>
        {/* Top Case Identity Card */}
        <Card style={styles.caseHeroCard}>
          <View style={styles.caseHeroTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.casePrefix}>DAGUPAN CITY TRANSIT GRIEVANCE</Text>
              <Text style={[styles.caseNumberText, { color: colors.textPrimary }]}>
                {complaint.lguCaseNumber || `SMARTSAKAY-${complaint._id.slice(-6).toUpperCase()}`}
              </Text>
            </View>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShareCase} activeOpacity={0.8}>
              <MaterialCommunityIcons name="share-variant-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.statusRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {isArchived && (
                <View style={styles.archiveBadge}>
                  <MaterialCommunityIcons name="archive" size={11} color="#D97706" />
                  <Text style={styles.archiveBadgeText}>Archived</Text>
                </View>
              )}
              {isDeleted && (
                <View style={styles.deletedBadge}>
                  <MaterialCommunityIcons name="trash-can" size={11} color="#EF4444" />
                  <Text style={styles.deletedBadgeText}>Deleted</Text>
                </View>
              )}
              <StatusBadge
                label={isDeleted ? 'Deleted' : isArchived ? 'Archived' : status.label}
                color={isDeleted ? '#EF4444' : isArchived ? '#F59E0B' : status.color}
                bgColor={isDeleted ? 'rgba(239, 68, 68, 0.15)' : isArchived ? 'rgba(245, 158, 11, 0.15)' : status.bgColor}
              />
            </View>
            <Text style={[styles.heroDate, { color: colors.textMuted }]}>
              Filed {formatDate(complaint.createdAt)}
            </Text>
          </View>
        </Card>

        {/* Commuter Management Toolbar & State Rules Notice */}
        <Card style={styles.manageCard}>
          {isDeleted ? (
            <View style={[styles.stateNoticeBanner, { backgroundColor: '#FEF2F2', borderColor: '#F87171' }]}>
              <MaterialCommunityIcons name="trash-can-outline" size={22} color="#EF4444" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.stateNoticeTitle, { color: '#B91C1C' }]}>Report Removed (In Trash)</Text>
                <Text style={[styles.stateNoticeDesc, { color: '#991B1B' }]}>
                  This report has been deleted and cannot be edited. You can restore it anytime with full progress intact.
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.manageBtn, { backgroundColor: '#10B981', borderColor: '#059669' }]}
                onPress={handleUndo}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="undo-variant" size={16} color="#FFFFFF" />
                <Text style={[styles.manageBtnText, { color: '#FFFFFF' }]}>Restore</Text>
              </TouchableOpacity>
            </View>
          ) : isArchived ? (
            <View style={[styles.stateNoticeBanner, { backgroundColor: '#FFFBEB', borderColor: '#FCD34D' }]}>
              <MaterialCommunityIcons name="archive-outline" size={22} color="#F59E0B" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.stateNoticeTitle, { color: '#92400E' }]}>Archived Report</Text>
                <Text style={[styles.stateNoticeDesc, { color: '#B45309' }]}>
                  This case is archived and cannot be edited. Unarchive it to enable active tracking and editing.
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.manageBtn, { backgroundColor: '#F59E0B', borderColor: '#D97706' }]}
                onPress={handleUnarchive}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="archive-arrow-up-outline" size={16} color="#FFFFFF" />
                <Text style={[styles.manageBtnText, { color: '#FFFFFF' }]}>Unarchive</Text>
              </TouchableOpacity>
            </View>
          ) : canEdit ? (
            <View style={[styles.stateNoticeBanner, { backgroundColor: 'rgba(2, 132, 199, 0.08)', borderColor: 'rgba(2, 132, 199, 0.25)' }]}>
              <MaterialCommunityIcons name="pencil-circle-outline" size={22} color="#0284C7" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.stateNoticeTitle, { color: '#0284C7' }]}>Case is In Progress (Editable)</Text>
                <Text style={[styles.stateNoticeDesc, { color: isDark ? '#BAE6FD' : '#0369A1' }]}>
                  You can edit the report details or plate number if you made a mistake before LGU takes action.
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.manageBtn, { backgroundColor: '#0284C7', borderColor: '#0369A1' }]}
                onPress={() => setEditModalVisible(true)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="pencil" size={15} color="#FFFFFF" />
                <Text style={[styles.manageBtnText, { color: '#FFFFFF' }]}>Edit Report</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.stateNoticeBanner, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC', borderColor: colors.border }]}>
              <MaterialCommunityIcons name="lock-outline" size={20} color={colors.textMuted} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.stateNoticeTitle, { color: colors.textPrimary }]}>Case Verified / Locked</Text>
                <Text style={[styles.stateNoticeDesc, { color: colors.textSecondary }]}>
                  Report details are locked for legal/official investigation integrity.
                </Text>
              </View>
            </View>
          )}

          {/* Sub Action Buttons (Archive & Delete) */}
          <View style={styles.manageButtonsRow}>
            {!isDeleted && (
              isArchived ? (
                <TouchableOpacity
                  style={[styles.subActionBtn, { borderColor: 'rgba(239, 68, 68, 0.3)' }]}
                  onPress={promptDelete}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={15} color="#EF4444" />
                  <Text style={[styles.subActionText, { color: '#EF4444' }]}>Delete to Trash</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.subActionBtn, { borderColor: colors.border }]}
                    onPress={handleArchive}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="archive-outline" size={15} color={colors.textSecondary} />
                    <Text style={[styles.subActionText, { color: colors.textSecondary }]}>Archive Case</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.subActionBtn, { borderColor: 'rgba(239, 68, 68, 0.3)' }]}
                    onPress={promptDelete}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={15} color="#EF4444" />
                    <Text style={[styles.subActionText, { color: '#EF4444' }]}>Delete / Cancel</Text>
                  </TouchableOpacity>
                </>
              )
            )}
          </View>
        </Card>

        {/* Live Status Tracker Timeline */}
        <View style={styles.sectionHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialCommunityIcons name="timeline-clock" size={20} color={colors.primary} />
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
              Investigation Timeline
            </Text>
          </View>
          <TouchableOpacity
            style={styles.refreshBadge}
            onPress={onRefresh}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="refresh" size={14} color={colors.primary} />
            <Text style={[styles.refreshBadgeText, { color: colors.primary }]}>Refresh</Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.timelineCard}>
          {timelineSteps.map((step, index) => {
            const isLast = index === timelineSteps.length - 1;
            const isCompleted = step.state === 'completed';
            const isCurrent = step.state === 'current';

            let nodeColor = isDark ? '#475569' : '#CBD5E1';
            let iconName = step.icon;

            if (isCompleted) {
              nodeColor = '#10B981';
            } else if (isCurrent) {
              nodeColor = '#0284C7';
            }

            return (
              <View key={index} style={styles.stepRow}>
                {/* Stepper Line and Node */}
                <View style={styles.stepperCol}>
                  <View
                    style={[
                      styles.stepperDot,
                      {
                        backgroundColor: isCompleted || isCurrent ? nodeColor : colors.surface,
                        borderColor: nodeColor,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={iconName}
                      size={14}
                      color={isCompleted || isCurrent ? '#FFFFFF' : nodeColor}
                    />
                  </View>
                  {!isLast ? (
                    <View
                      style={[
                        styles.stepperLine,
                        {
                          backgroundColor: isCompleted ? '#10B981' : isDark ? '#334155' : '#E2E8F0',
                        },
                      ]}
                    />
                  ) : null}
                </View>

                {/* Stepper Content */}
                <View style={[styles.stepperContent, !isLast && { paddingBottom: 22 }]}>
                  <View style={styles.stepTitleRow}>
                    <Text
                      style={[
                        styles.stepTitle,
                        {
                          color: isCompleted
                            ? colors.textPrimary
                            : isCurrent
                            ? '#0284C7'
                            : colors.textMuted,
                          fontWeight: isCompleted || isCurrent ? '700' : '500',
                        },
                      ]}
                    >
                      {step.title}
                    </Text>
                    {Boolean(step.date) ? (
                      <Text style={[styles.stepDate, { color: colors.textMuted }]}>
                        {formatDate(step.date)}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                    {step.subtitle}
                  </Text>
                </View>
              </View>
            );
          })}
        </Card>

        {/* Official LGU Action Card (if present) */}
        {Boolean(complaint.lguActionNotes) ? (
          <View style={[styles.actionBanner, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5', borderColor: '#10B981' }]}>
            <View style={styles.actionBannerHeader}>
              <View style={[styles.actionBannerIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                <MaterialCommunityIcons name="police-badge" size={20} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionBannerTitle, { color: isDark ? '#6EE7B7' : '#047857' }]}>
                  Official Action Taken by Dagupan LGU
                </Text>
                {Boolean(complaint.lguActionTakenAt) ? (
                  <Text style={[styles.actionBannerDate, { color: isDark ? '#A7F3D0' : '#065F46' }]}>
                    Recorded on {formatDateTime(complaint.lguActionTakenAt)}
                  </Text>
                ) : null}
              </View>
            </View>
            <Text style={[styles.actionBannerBody, { color: isDark ? '#E2E8F0' : '#064E3B' }]}>
              {complaint.lguActionNotes}
            </Text>
          </View>
        ) : null}

        {/* Case Terminated & Resolved Summary (if present) */}
        {Boolean(complaint.lguTerminationNotes) ? (
          <View style={[styles.actionBanner, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.12)' : '#F5F3FF', borderColor: '#8B5CF6' }]}>
            <View style={styles.actionBannerHeader}>
              <View style={[styles.actionBannerIcon, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                <MaterialCommunityIcons name="check-decagram" size={20} color="#8B5CF6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionBannerTitle, { color: isDark ? '#C4B5FD' : '#6D28D9' }]}>
                  Case Resolution & Closure Notice
                </Text>
                {Boolean(complaint.lguTerminatedAt) ? (
                  <Text style={[styles.actionBannerDate, { color: isDark ? '#DDD6FE' : '#5B21B6' }]}>
                    Concluded on {formatDateTime(complaint.lguTerminatedAt)}
                  </Text>
                ) : null}
              </View>
            </View>
            <Text style={[styles.actionBannerBody, { color: isDark ? '#E2E8F0' : '#4C1D95' }]}>
              {complaint.lguTerminationNotes}
            </Text>
          </View>
        ) : null}

        {/* Operator Notes (if present) */}
        {Boolean(complaint.adminNotes) ? (
          <Card style={[styles.operatorNoteCard, { backgroundColor: colors.surface }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <MaterialCommunityIcons name="message-text-outline" size={16} color={colors.primary} />
              <Text style={[styles.noteHeading, { color: colors.primary }]}>Operator Remarks</Text>
            </View>
            <Text style={[styles.noteContent, { color: colors.textPrimary }]}>{complaint.adminNotes}</Text>
          </Card>
        ) : null}

        {/* Report Details Dossier */}
        <View style={[styles.sectionHeaderRow, { marginTop: SPACING.lg }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialCommunityIcons name="file-document-outline" size={20} color={colors.textPrimary} />
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Grievance Details</Text>
          </View>
        </View>

        <Card>
          <Text style={[styles.subjectTitle, { color: colors.textPrimary }]}>{complaint.subject}</Text>

          <View style={styles.catRow}>
            <MaterialCommunityIcons name={cat?.icon || 'alert-circle'} size={16} color={colors.textSecondary} />
            <Text style={[styles.catText, { color: colors.textSecondary }]}>
              {cat?.label || complaint.category}
            </Text>
          </View>

          <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
            {complaint.description}
          </Text>

          {/* Vehicle and Route metadata */}
          <Divider />
          <View style={styles.detailsGrid}>
            {Boolean(complaint.vehiclePlateNumber) ? (
              <View style={styles.gridItem}>
                <Text style={[styles.gridLabel, { color: colors.textMuted }]}>PLATE NUMBER</Text>
                <View style={styles.plateTag}>
                  <MaterialCommunityIcons name="car" size={14} color="#D97706" />
                  <Text style={styles.plateTagText}>{complaint.vehiclePlateNumber}</Text>
                </View>
              </View>
            ) : null}

            {Boolean(complaint.routeId?.name) ? (
              <View style={styles.gridItem}>
                <Text style={[styles.gridLabel, { color: colors.textMuted }]}>ROUTE</Text>
                <Text style={[styles.gridValue, { color: colors.textPrimary }]}>
                  {complaint.routeId.name}
                </Text>
              </View>
            ) : null}
          </View>
        </Card>

        {/* Evidence Photos */}
        {hasPhotos ? (
          <>
            <View style={[styles.sectionHeaderRow, { marginTop: SPACING.lg }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="camera" size={20} color={colors.textPrimary} />
                <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
                  Attached Evidence ({complaint.attachments.length})
                </Text>
              </View>
            </View>

            <View style={styles.photosRow}>
              {complaint.attachments.map((url, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setSelectedPhoto(url)}
                  activeOpacity={0.85}
                  style={styles.thumbnailWrapper}
                >
                  <Image source={{ uri: url }} style={styles.thumbnail} />
                  <View style={styles.zoomIconPill}>
                    <MaterialCommunityIcons name="magnify-plus" size={14} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : null}

        {/* Dagupan City Ordinance Advice Box */}
        <View style={[styles.rightsCard, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.08)' : '#F0F9FF', borderColor: 'rgba(56, 189, 248, 0.3)' }]}>
          <MaterialCommunityIcons name="information" size={20} color="#0284C7" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.rightsTitle, { color: '#0284C7' }]}>
              Official Dagupan POSO Case Record
            </Text>
            <Text style={[styles.rightsBody, { color: isDark ? '#BAE6FD' : '#0369A1' }]}>
              Dagupan City Ordinance and LTFRB regulations strictly mandate compliance with approved fare matrices and the 20% discount for Students, Senior Citizens, and PWDs. If you need follow-up in person, present this Case Tracking Number at Dagupan POSO / City Hall.
            </Text>
          </View>
        </View>
      </View>

      {/* Full Screen Photo Modal */}
      {selectedPhoto && (
        <Modal visible={true} transparent={true} animationType="fade" onRequestClose={() => setSelectedPhoto(null)}>
          <View style={styles.modalBackdrop}>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedPhoto(null)}>
              <MaterialCommunityIcons name="close-circle" size={36} color="#FFFFFF" />
            </TouchableOpacity>
            <Image source={{ uri: selectedPhoto }} style={styles.modalFullImage} resizeMode="contain" />
          </View>
        </Modal>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.xl,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  notFoundTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    marginTop: 12,
  },
  notFoundSubtitle: {
    fontSize: FONTS.sizes.sm,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: FONTS.sizes.sm,
  },
  caseHeroCard: {
    padding: 16,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
  },
  caseHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  casePrefix: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  caseNumberText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '900',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  shareBtn: {
    padding: 6,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  archiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  archiveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  deletedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  deletedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EF4444',
  },
  heroDate: {
    fontSize: 12,
  },
  manageCard: {
    padding: 12,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
  },
  stateNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  stateNoticeTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  stateNoticeDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 38,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  manageBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  manageButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    justifyContent: 'flex-end',
  },
  subActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 38,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  subActionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionHeading: {
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
  },
  refreshBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
  },
  refreshBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  timelineCard: {
    padding: 16,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
  },
  stepRow: {
    flexDirection: 'row',
  },
  stepperCol: {
    alignItems: 'center',
    width: 28,
  },
  stepperDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  stepperLine: {
    width: 2,
    flex: 1,
    marginVertical: 2,
  },
  stepperContent: {
    flex: 1,
    marginLeft: 12,
  },
  stepTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  stepTitle: {
    fontSize: FONTS.sizes.sm,
  },
  stepDate: {
    fontSize: 10,
  },
  stepSubtitle: {
    fontSize: 11,
    lineHeight: 16,
  },
  actionBanner: {
    borderWidth: 1.5,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: SPACING.md,
  },
  actionBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  actionBannerIcon: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  actionBannerDate: {
    fontSize: 10,
    marginTop: 1,
  },
  actionBannerBody: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  operatorNoteCard: {
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.3)',
    marginBottom: SPACING.md,
  },
  noteHeading: {
    fontSize: 12,
    fontWeight: '700',
  },
  noteContent: {
    fontSize: 12,
    lineHeight: 18,
  },
  subjectTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
    marginBottom: 6,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  catText: {
    fontSize: 12,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 6,
  },
  gridItem: {
    minWidth: '40%',
  },
  gridLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  plateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
  },
  plateTagText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D97706',
    fontFamily: 'monospace',
  },
  photosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: SPACING.lg,
  },
  thumbnailWrapper: {
    position: 'relative',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  thumbnail: {
    width: 90,
    height: 90,
    borderRadius: RADIUS.md,
  },
  zoomIconPill: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: RADIUS.full,
    padding: 3,
  },
  rightsCard: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginTop: SPACING.sm,
  },
  rightsTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  rightsBody: {
    fontSize: 11,
    lineHeight: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  modalFullImage: {
    width: '92%',
    height: '80%',
  },
});

export default ComplaintDetailScreen;
