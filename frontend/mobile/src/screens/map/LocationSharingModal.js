import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Switch,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import { locationSharingAPI } from "../../api/services";
import { FONTS, SPACING, RADIUS, API_BASE_URL } from "../../utils/constants";
import { getInitials } from "../../utils/helpers";

const LocationSharingModal = ({ visible, onClose, onRefreshPeers }) => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useFeedback();

  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchedUser, setSearchedUser] = useState(null);
  const [existingConn, setExistingConn] = useState(null);

  const [loading, setLoading] = useState(false);
  const [outgoing, setOutgoing] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [activeCount, setActiveCount] = useState(0);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const res = await locationSharingAPI.getConnections();
      if (res.data?.success) {
        setOutgoing(res.data.data.outgoing || []);
        setIncoming(res.data.data.incoming || []);
        setActiveCount(res.data.data.activeCount || 0);
      }
    } catch (e) {
      console.warn("Error fetching connections:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchConnections();
      setSearchedUser(null);
      setSearchQuery("");
    }
  }, [visible]);

  const handleCopyId = async () => {
    const idToCopy = user?._id || user?.email || "";
    if (!idToCopy) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(idToCopy);
      }
      showSuccess("ID Copied", "Your Commuter Share ID has been copied to clipboard.");
    } catch (e) {
      showInfo("Share ID", `Your ID: ${idToCopy}`);
    }
  };

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) {
      showError("Empty Query", "Enter a User ID, name, or email to search.");
      return;
    }
    if (
      user &&
      (q.toLowerCase() === String(user.email).toLowerCase() ||
        q === String(user._id))
    ) {
      showError("Self Search", "You cannot request location access from yourself.");
      return;
    }

    setSearching(true);
    setSearchedUser(null);
    setExistingConn(null);
    try {
      const res = await locationSharingAPI.searchUser(q);
      if (res.data?.success) {
        setSearchedUser(res.data.data.user);
        setExistingConn(res.data.data.existingConnection);
      }
    } catch (e) {
      showError(
        "User Not Found",
        e.response?.data?.message || "No commuter found with that ID, name, or email."
      );
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async () => {
    if (!searchedUser) return;
    if (activeCount >= 10) {
      showError(
        "Limit Reached",
        "You can only request location access for up to 10 users. Remove an existing request to continue."
      );
      return;
    }

    try {
      setActionLoadingId("search-request");
      const res = await locationSharingAPI.sendRequest(searchedUser._id);
      if (res.data?.success) {
        showSuccess(
          "Success",
          res.data.message || `Location access request sent to ${searchedUser.firstName} ${searchedUser.lastName}.`
        );
        setSearchedUser(null);
        setSearchQuery("");
        await fetchConnections();
        if (onRefreshPeers) onRefreshPeers();
      }
    } catch (e) {
      showError(
        "Request Failed",
        e.response?.data?.message || "Could not send location request."
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRespond = async (id, action) => {
    try {
      setActionLoadingId(id);
      const res = await locationSharingAPI.respondToRequest(id, action);
      if (res.data?.success) {
        showSuccess("Updated", `Request ${action}ed.`);
        if (searchedUser) {
          setSearchedUser(null);
          setSearchQuery("");
        }
        await fetchConnections();
        if (onRefreshPeers) onRefreshPeers();
      }
    } catch (e) {
      showError("Failed", e.response?.data?.message || "Action failed.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleSharing = async (id, currentVal) => {
    try {
      setActionLoadingId(id);
      const res = await locationSharingAPI.toggleSharing(id, !currentVal);
      if (res.data?.success) {
        showInfo(
          "Sharing Updated",
          !currentVal ? "Location access turned ON." : "Location access turned OFF."
        );
        await fetchConnections();
        if (onRefreshPeers) onRefreshPeers();
      }
    } catch (e) {
      showError("Failed", e.response?.data?.message || "Could not update sharing.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemoveOrBlock = async (id, block = false) => {
    const message = block
      ? "Are you sure you want to block this user from accessing your location?"
      : "Are you sure you want to remove this location sharing connection?";

    const performAction = async () => {
      try {
        setActionLoadingId(id);
        const res = await locationSharingAPI.removeConnection(id, block);
        if (res.data?.success) {
          showSuccess("Success", block ? "User blocked." : "Connection removed.");
          await fetchConnections();
          if (onRefreshPeers) onRefreshPeers();
        }
      } catch (e) {
        showError("Failed", e.response?.data?.message || "Action failed.");
      } finally {
        setActionLoadingId(null);
      }
    };

    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(message)) {
        await performAction();
      }
      return;
    }

    Alert.alert(
      block ? "Block User" : "Remove Connection",
      message,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: block ? "Block" : "Remove",
          style: "destructive",
          onPress: performAction,
        },
      ]
    );
  };

  const renderAvatar = (targetUser) => {
    const photo = targetUser?.profilePhoto;
    if (photo) {
      const uri = photo.startsWith("http")
        ? photo
        : `${API_BASE_URL.replace(/\/api$/, "")}${photo}`;
      return <Image source={{ uri }} style={styles.peerAvatarImg} />;
    }
    return (
      <View style={[styles.peerAvatarFallback, { backgroundColor: colors.primary }]}>
        <Text style={styles.peerAvatarInitials}>
          {getInitials(targetUser?.firstName, targetUser?.lastName)}
        </Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <MaterialCommunityIcons name="account-group" size={24} color={colors.primary} />
              <View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  SakayCircle Location Sharing
                </Text>
                <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
                  Live tracking with authorized commuters ({activeCount}/10 used)
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* My Shareable User ID Info Box */}
            <View style={[styles.myIdCard, { backgroundColor: isDark ? "rgba(37,99,235,0.15)" : "#EFF6FF", borderColor: "#93C5FD" }]}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                  <Text style={styles.myIdLabel}>YOUR SAKAYCIRCLE COMMUTER ID</Text>
                  <TouchableOpacity onPress={handleCopyId} style={styles.copyIdBtn} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="content-copy" size={13} color={colors.primary} />
                    <Text style={[styles.copyIdText, { color: colors.primary }]}>Copy</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.myIdValue, { color: colors.textPrimary }]} numberOfLines={1} selectable>
                  {user?._id || user?.email}
                </Text>
                <Text style={styles.myIdHint}>Share this ID, name, or email with members so they can request access.</Text>
              </View>
              <View style={[styles.quotaBadge, { backgroundColor: activeCount >= 10 ? "#EF4444" : colors.primary }]}>
                <Text style={styles.quotaText}>{activeCount}/10</Text>
              </View>
            </View>

            {/* Search Box */}
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
              Request Access to User Location
            </Text>
            <View style={styles.searchRow}>
              <TextInput
                style={[
                  styles.searchInput,
                  {
                    backgroundColor: colors.background,
                    color: colors.textPrimary,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Enter User ID, email, or name..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                returnKeyType="search"
                onSubmitEditing={handleSearch}
              />
              <TouchableOpacity
                style={[styles.searchBtn, { backgroundColor: colors.primary }]}
                onPress={handleSearch}
                disabled={searching}
              >
                {searching ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <MaterialCommunityIcons name="magnify" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>

            {/* Search Result Card */}
            {searchedUser && (
              <View style={[styles.resultCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                  {renderAvatar(searchedUser)}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.resultName, { color: colors.textPrimary }]}>
                      {searchedUser.firstName} {searchedUser.lastName}
                    </Text>
                    <Text style={[styles.resultEmail, { color: colors.textSecondary }]}>
                      {searchedUser.email}
                    </Text>
                  </View>
                </View>

                {existingConn?.status === "accepted" ? (
                  <View style={styles.statusPillActive}>
                    <Text style={styles.statusPillText}>Connected</Text>
                  </View>
                ) : existingConn?.status === "pending" ? (
                  String(existingConn?.recipient) === String(user?._id) ? (
                    <TouchableOpacity
                      style={[styles.requestActionBtn, { backgroundColor: "#10B981" }]}
                      onPress={() => handleRespond(existingConn._id, "accept")}
                      disabled={actionLoadingId === existingConn._id}
                    >
                      <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
                      <Text style={styles.requestActionBtnText}>Accept</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.statusPillPending}>
                      <Text style={styles.statusPillText}>Pending</Text>
                    </View>
                  )
                ) : existingConn?.status === "blocked" ? (
                  <View style={styles.statusPillBlocked}>
                    <Text style={styles.statusPillText}>Blocked</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.requestActionBtn,
                      { backgroundColor: activeCount >= 10 ? "#9CA3AF" : colors.primary },
                    ]}
                    onPress={handleSendRequest}
                    disabled={actionLoadingId === "search-request" || activeCount >= 10}
                  >
                    {actionLoadingId === "search-request" ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="send" size={14} color="#FFFFFF" />
                        <Text style={styles.requestActionBtnText}>Request Access</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Incoming Requests Section */}
            {incoming.filter((c) => c.status === "pending").length > 0 && (
              <View style={styles.sectionWrap}>
                <Text style={[styles.sectionHeading, { color: "#D97706" }]}>
                  Incoming Requests ({incoming.filter((c) => c.status === "pending").length})
                </Text>
                {incoming
                  .filter((c) => c.status === "pending")
                  .map((item) => (
                    <View
                      key={item._id}
                      style={[styles.itemCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        {renderAvatar(item.requester)}
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.itemName, { color: colors.textPrimary }]}>
                            {item.requester?.firstName} {item.requester?.lastName}
                          </Text>
                          <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                            Wants to share live location with you
                          </Text>
                        </View>
                      </View>

                      <View style={styles.incomingActionsRow}>
                        <TouchableOpacity
                          style={[styles.smallBtn, { backgroundColor: "#10B981" }]}
                          onPress={() => handleRespond(item._id, "accept")}
                          disabled={actionLoadingId === item._id}
                        >
                          <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                          <Text style={styles.smallBtnText}>Accept</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.smallBtn, { backgroundColor: "#6B7280" }]}
                          onPress={() => handleRespond(item._id, "decline")}
                          disabled={actionLoadingId === item._id}
                        >
                          <MaterialCommunityIcons name="close" size={16} color="#FFFFFF" />
                          <Text style={styles.smallBtnText}>Decline</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.smallBtn, { backgroundColor: "#EF4444" }]}
                          onPress={() => handleRespond(item._id, "block")}
                          disabled={actionLoadingId === item._id}
                        >
                          <MaterialCommunityIcons name="shield-lock" size={16} color="#FFFFFF" />
                          <Text style={styles.smallBtnText}>Block</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
              </View>
            )}

            {/* Connected Peers Section */}
            <View style={styles.sectionWrap}>
              <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
                Connected Members on Map
              </Text>

              {loading ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 16 }} />
              ) : outgoing.filter((c) => c.status === "accepted").length === 0 &&
                incoming.filter((c) => c.status === "accepted").length === 0 ? (
                <View style={[styles.emptyBox, { borderColor: colors.border }]}>
                  <MaterialCommunityIcons name="map-marker-account-outline" size={32} color={colors.textMuted} />
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    No active location sharing connections yet. Search a User ID above to request access.
                  </Text>
                </View>
              ) : (
                <>
                  {/* Peers you requested and accepted */}
                  {outgoing
                    .filter((c) => c.status === "accepted")
                    .map((item) => {
                      const peer = item.recipient;
                      const isSharingOn = item.isRequesterSharing;
                      return (
                        <View
                          key={item._id}
                          style={[styles.itemCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                        >
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                            {renderAvatar(peer)}
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.itemName, { color: colors.textPrimary }]}>
                                {peer?.firstName} {peer?.lastName}
                              </Text>
                              <Text style={[styles.itemSub, { color: "#10B981" }]}>
                                ● Profile visible on map
                              </Text>
                            </View>
                          </View>

                          <View style={styles.activePeerControls}>
                            <View style={styles.toggleRow}>
                              <Text style={[styles.toggleLabel, { color: colors.textSecondary }]}>
                                {isSharingOn ? "Sharing: ON" : "Sharing: OFF"}
                              </Text>
                              <Switch
                                value={isSharingOn}
                                onValueChange={() => handleToggleSharing(item._id, isSharingOn)}
                                trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
                                thumbColor={isSharingOn ? "#2563EB" : "#9CA3AF"}
                              />
                            </View>

                            <TouchableOpacity
                              onPress={() => handleRemoveOrBlock(item._id, false)}
                              style={styles.iconActionBtn}
                            >
                              <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" />
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => handleRemoveOrBlock(item._id, true)}
                              style={styles.iconActionBtn}
                            >
                              <MaterialCommunityIcons name="cancel" size={18} color="#9CA3AF" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}

                  {/* Peers who requested you and you accepted */}
                  {incoming
                    .filter((c) => c.status === "accepted")
                    .map((item) => {
                      const peer = item.requester;
                      const isSharingOn = item.isRecipientSharing;
                      return (
                        <View
                          key={item._id}
                          style={[styles.itemCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                        >
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                            {renderAvatar(peer)}
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.itemName, { color: colors.textPrimary }]}>
                                {peer?.firstName} {peer?.lastName}
                              </Text>
                              <Text style={[styles.itemSub, { color: "#10B981" }]}>
                                ● Profile visible on map
                              </Text>
                            </View>
                          </View>

                          <View style={styles.activePeerControls}>
                            <View style={styles.toggleRow}>
                              <Text style={[styles.toggleLabel, { color: colors.textSecondary }]}>
                                {isSharingOn ? "Sharing: ON" : "Sharing: OFF"}
                              </Text>
                              <Switch
                                value={isSharingOn}
                                onValueChange={() => handleToggleSharing(item._id, isSharingOn)}
                                trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
                                thumbColor={isSharingOn ? "#2563EB" : "#9CA3AF"}
                              />
                            </View>

                            <TouchableOpacity
                              onPress={() => handleRemoveOrBlock(item._id, false)}
                              style={styles.iconActionBtn}
                            >
                              <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" />
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => handleRemoveOrBlock(item._id, true)}
                              style={styles.iconActionBtn}
                            >
                              <MaterialCommunityIcons name="cancel" size={18} color="#9CA3AF" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                </>
              )}
            </View>

            {/* Outgoing Pending Requests */}
            {outgoing.filter((c) => c.status === "pending").length > 0 && (
              <View style={styles.sectionWrap}>
                <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                  Pending Outgoing Requests ({outgoing.filter((c) => c.status === "pending").length})
                </Text>
                {outgoing
                  .filter((c) => c.status === "pending")
                  .map((item) => (
                    <View
                      key={item._id}
                      style={[styles.itemCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                        {renderAvatar(item.recipient)}
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.itemName, { color: colors.textPrimary }]}>
                            {item.recipient?.firstName} {item.recipient?.lastName}
                          </Text>
                          <Text style={[styles.itemSub, { color: "#F59E0B" }]}>
                            Awaiting response...
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleRemoveOrBlock(item._id, false)}
                        style={styles.cancelRequestBtn}
                      >
                        <Text style={styles.cancelRequestText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  modalCard: {
    maxHeight: "88%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: "800",
  },
  modalSub: {
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  myIdCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: 16,
  },
  myIdLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#2563EB",
    letterSpacing: 0.5,
  },
  copyIdBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(37,99,235,0.12)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  copyIdText: {
    fontSize: 10,
    fontWeight: "800",
  },
  myIdValue: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
    marginTop: 2,
  },
  myIdHint: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  quotaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginLeft: 10,
  },
  quotaText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  sectionHeading: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "800",
    marginBottom: 8,
    marginTop: 4,
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: FONTS.sizes.sm,
  },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
  },
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: 16,
  },
  resultName: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  resultEmail: {
    fontSize: 11,
  },
  requestActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  requestActionBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  statusPillActive: {
    backgroundColor: "#10B98120",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: "#10B981",
  },
  statusPillPending: {
    backgroundColor: "#F59E0B20",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  statusPillBlocked: {
    backgroundColor: "#EF444420",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#374151",
  },
  sectionWrap: {
    marginBottom: 18,
  },
  itemCard: {
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: 10,
  },
  itemName: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  itemSub: {
    fontSize: 11,
    marginTop: 2,
  },
  incomingActionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  smallBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  smallBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  activePeerControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(156,163,175,0.2)",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginRight: "auto",
  },
  toggleLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  iconActionBtn: {
    padding: 6,
  },
  cancelRequestBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    backgroundColor: "#EF444420",
  },
  cancelRequestText: {
    color: "#EF4444",
    fontSize: 11,
    fontWeight: "700",
  },
  peerAvatarImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  peerAvatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  peerAvatarInitials: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },
  emptyBox: {
    padding: 24,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  emptyText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
  },
});

export default LocationSharingModal;
