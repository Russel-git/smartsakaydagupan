import React, { useState, useEffect } from "react";
import {
  Search,
  UserPlus,
  X,
  Trash2,
  ShieldCheck,
  Building2,
  BadgeAlert,
  UserCheck,
  UserX,
  Power,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";

import { usersAPI } from "../api/services";
import ConfirmModal from "../components/common/ConfirmModal";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useTheme } from "../contexts/theme/ThemeContext";

const UsersPage = () => {
  const { colors } = useTheme();
  const { admin: currentUser, isAdmin, isLgu } = useAuth();
  const { showSuccess, showError } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // ============================================================
  // ADD USER MODAL STATE
  // ============================================================

  const [showAddModal, setShowAddModal] = useState(false);

  const [createForm, setCreateForm] = useState({
    firstName: "",
    lastName: "",
    suffix: "",
    email: "",
    password: "",
    role: isAdmin ? "lgu" : "poso",
    municipality: "Dagupan",
    department: isAdmin ? "City Transport & Public Safety Office (CTPSO)" : "Public Order & Safety Office (POSO)",
    badgeNumber: "",
    assignedZone: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ============================================================
  // CONFIRMATION MODAL
  // ============================================================

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    type: "danger",
    loading: false,
    onConfirm: () => {},
  });

  // ============================================================
  // FETCH USERS (SCOPED)
  // ============================================================

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const targetRole = isLgu ? "poso" : (isAdmin ? "lgu" : "");
      const res = await usersAPI.getAll({ role: targetRole });
      const items = res.data?.data?.items || (Array.isArray(res.data?.data) ? res.data.data : []);
      setUsers(items);
    } catch (err) {
      console.error("Failed to load users:", err);
      showError("Loading Failed", err.response?.data?.message || "Failed to load user accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [isAdmin, isLgu]);

  // ============================================================
  // TOGGLE ACCOUNT STATUS (SUSPEND / ACTIVATE)
  // ============================================================

  const handleToggleStatus = (user) => {
    const isActivating = !user.isActive;
    const actionLabel = isActivating ? "Activate" : "Suspend";

    setConfirmConfig({
      isOpen: true,
      title: `${actionLabel} Account Access`,
      message: `Are you sure you want to ${actionLabel.toLowerCase()} account access for ${user.firstName} ${user.lastName} (${user.email})? ${
        !isActivating ? "This user will be immediately blocked from signing into the console." : "The user will regain immediate access."
      }`,
      confirmText: `${actionLabel} Account`,
      cancelText: "Cancel",
      type: isActivating ? "primary" : "danger",
      loading: false,

      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, loading: true }));
        try {
          await usersAPI.updateStatus(user._id, isActivating);
          showSuccess(
            "Status Updated",
            `Account for ${user.firstName} ${user.lastName} has been ${isActivating ? "activated" : "suspended"}.`
          );
          setConfirmConfig((prev) => ({ ...prev, isOpen: false, loading: false }));
          fetchUsers();
        } catch (err) {
          showError("Action Failed", err.response?.data?.message || "Failed to update account status.");
          setConfirmConfig((prev) => ({ ...prev, loading: false }));
        }
      },
    });
  };

  // ============================================================
  // DELETE SUSPENDED ACCOUNT
  // ============================================================

  const handleDeleteUser = (user) => {
    if (user.isActive) {
      showError(
        "Action Not Permitted",
        "The account must be suspended before it can be deleted. Please suspend the account first."
      );
      return;
    }

    setConfirmConfig({
      isOpen: true,
      title: "Permanently Delete Account",
      message: `Are you sure you want to permanently delete the account for ${user.firstName} ${user.lastName} (${user.email})? This action cannot be undone and will purge all credentials from the system.`,
      confirmText: "Delete Account Permanently",
      cancelText: "Cancel",
      type: "danger",
      loading: false,

      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, loading: true }));
        try {
          await usersAPI.delete(user._id);
          showSuccess(
            "Account Deleted",
            `Account for ${user.firstName} ${user.lastName} has been permanently deleted.`
          );
          setConfirmConfig((prev) => ({ ...prev, isOpen: false, loading: false }));
          fetchUsers();
        } catch (err) {
          showError("Delete Failed", err.response?.data?.message || "Failed to delete account.");
          setConfirmConfig((prev) => ({ ...prev, loading: false }));
        }
      },
    });
  };

  // ============================================================
  // CHANGE / RECOVER PASSWORD MODAL STATE & HANDLERS
  // ============================================================

  const [passwordModal, setPasswordModal] = useState({
    isOpen: false,
    user: null,
    newPassword: "",
    showPassword: false,
    submitting: false,
  });

  const handleOpenPasswordModal = (user) => {
    setPasswordModal({
      isOpen: true,
      user,
      newPassword: "",
      showPassword: false,
      submitting: false,
    });
  };

  const handleGenerateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let randomPass = "";
    for (let i = 0; i < 10; i++) {
      randomPass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPasswordModal((prev) => ({ ...prev, newPassword: randomPass, showPassword: true }));
  };

  const handleSubmitPasswordChange = async (e) => {
    e.preventDefault();
    if (!passwordModal.newPassword || passwordModal.newPassword.length < 6) {
      showError("Invalid Password", "New password must be at least 6 characters long.");
      return;
    }

    setPasswordModal((prev) => ({ ...prev, submitting: true }));
    try {
      await usersAPI.resetPassword(passwordModal.user._id, passwordModal.newPassword);
      showSuccess(
        "Password Updated",
        `Password for ${passwordModal.user.firstName} ${passwordModal.user.lastName} (${passwordModal.user.email}) has been updated successfully.`
      );
      setPasswordModal({
        isOpen: false,
        user: null,
        newPassword: "",
        showPassword: false,
        submitting: false,
      });
    } catch (err) {
      showError("Update Failed", err.response?.data?.message || "Failed to update user password.");
      setPasswordModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // ============================================================
  // CREATE STAFF ACCOUNT (SCOPED: ADMIN->LGU, LGU->POSO)
  // ============================================================

  const handleCreateStaff = async (e) => {
    e.preventDefault();

    if (!createForm.firstName || !createForm.lastName || !createForm.email || !createForm.password) {
      showError("Missing Fields", "Please complete all required fields.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...createForm,
        role: isAdmin ? "lgu" : "poso",
      };

      await usersAPI.create(payload);

      showSuccess(
        "Account Created",
        `New ${payload.role.toUpperCase()} account for ${createForm.firstName} ${createForm.lastName} (${createForm.email}) provisioned successfully.`
      );

      setShowAddModal(false);

      setCreateForm({
        firstName: "",
        lastName: "",
        suffix: "",
        email: "",
        password: "",
        role: isAdmin ? "lgu" : "poso",
        municipality: "Dagupan",
        department: isAdmin ? "City Transport & Public Safety Office (CTPSO)" : "Public Order & Safety Office (POSO)",
        badgeNumber: "",
        assignedZone: "",
      });

      fetchUsers();
    } catch (err) {
      showError("Creation Failed", err.response?.data?.message || "Failed to create user account.");
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // FILTER USERS
  // ============================================================

  const filteredUsers = users.filter((u) => {
    if (statusFilter === "active" && !u.isActive) return false;
    if (statusFilter === "suspended" && u.isActive) return false;

    if (!search.trim()) return true;
    const term = search.toLowerCase();
    const name = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
    const email = (u.email || "").toLowerCase();
    const badge = (u.badgeNumber || "").toLowerCase();
    const dept = (u.department || "").toLowerCase();

    return name.includes(term) || email.includes(term) || badge.includes(term) || dept.includes(term);
  });

  return (
    <div style={{ padding: "0 0 40px 0" }}>
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <h1 style={{ fontSize: "24px", fontWeight: "800", color: colors.textPrimary, margin: 0 }}>
              {isAdmin ? "LGU Account Management" : "POSO Field Enforcers Management"}
            </h1>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "700",
                padding: "3px 8px",
                borderRadius: "6px",
                backgroundColor: isAdmin ? "#EEF2FF" : "#FEF3C7",
                color: isAdmin ? "#4F46E5" : "#D97706",
                letterSpacing: "0.05em",
              }}
            >
              {isAdmin ? "LGU GOVERNANCE" : "POSO ENFORCEMENT"}
            </span>
          </div>

          <p style={{ color: colors.textMuted, fontSize: "13px", margin: 0 }}>
            {isAdmin
              ? "Provision and manage Dagupan City LGU Transport Authority accounts. Control active/suspended status."
              : "Provision and oversee on-road Public Order & Safety Office (POSO) traffic enforcers and road inspectors."}
          </p>
        </div>

        <button
          onClick={() => {
            setCreateForm({
              firstName: "",
              lastName: "",
              suffix: "",
              email: "",
              password: "",
              role: isAdmin ? "lgu" : "poso",
              department: isAdmin ? "City Transport & Public Safety Office (CTPSO)" : "Public Order & Safety Office (POSO)",
              badgeNumber: "",
              assignedZone: "",
            });
            setShowAddModal(true);
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            backgroundColor: colors.primary,
            color: "#FFFFFF",
            border: "none",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            boxShadow: `0 4px 14px ${colors.primaryDark}30`,
          }}
        >
          <UserPlus size={16} />
          <span>{isAdmin ? "Add LGU Account" : "Add POSO Officer"}</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div style={{ display: "flex", gap: "14px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "260px", maxWidth: "380px" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "14px",
              top: "14px",
              color: colors.textMuted,
            }}
          />
          <input
            type="text"
            placeholder={isAdmin ? "Search by officer name, email, department..." : "Search by name, email, badge, zone..."}
            className="form-input"
            style={{ paddingLeft: "40px" }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ maxWidth: "180px" }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Accounts Only</option>
          <option value="suspended">Suspended Accounts Only</option>
        </select>
      </div>

      {/* Accounts Table */}
      <div
        style={{
          backgroundColor: colors.surface,
          borderRadius: "16px",
          border: `1px solid ${colors.border}`,
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: colors.textMuted }}>
            Loading accounts...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: colors.textMuted }}>
            No accounts found matching your query.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ backgroundColor: colors.background, color: colors.textSecondary, textAlign: "left" }}>
                  <th style={{ padding: "14px 20px", fontWeight: "600" }}>Officer / Name</th>
                  <th style={{ padding: "14px 20px", fontWeight: "600" }}>Email Address</th>
                  <th style={{ padding: "14px 20px", fontWeight: "600" }}>
                    {isLgu ? "Badge & Zone" : "Department"}
                  </th>
                  <th style={{ padding: "14px 20px", fontWeight: "600" }}>Status</th>
                  <th style={{ padding: "14px 20px", fontWeight: "600" }}>Registered Date</th>
                  <th style={{ padding: "14px 20px", fontWeight: "600", textAlign: "right" }}>Account Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((u) => {
                  const isCurrent = currentUser?._id === u._id;

                  return (
                    <tr key={u._id} style={{ borderTop: `1px solid ${colors.border}` }}>
                      {/* Name / Profile */}
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              backgroundColor: u.role === "lgu" ? "#EEF2FF" : "#FEF3C7",
                              color: u.role === "lgu" ? "#4F46E5" : "#D97706",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: "700",
                              fontSize: "13px",
                            }}
                          >
                            {u.firstName ? u.firstName[0].toUpperCase() : "U"}
                          </div>
                          <div>
                            <span style={{ fontWeight: "700", color: colors.textPrimary, display: "block" }}>
                              {u.firstName} {u.lastName} {u.suffix ? ` ${u.suffix}` : ""}
                            </span>
                            {isCurrent && (
                              <span style={{ fontSize: "10px", color: colors.primary, fontWeight: "700" }}>
                                (Current Session)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td style={{ padding: "14px 20px", color: colors.textSecondary }}>{u.email}</td>

                      {/* Department or Badge/Zone */}
                      <td style={{ padding: "14px 20px" }}>
                        {isLgu ? (
                          <div>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "2px 8px",
                                borderRadius: "4px",
                                backgroundColor: "#FEF3C7",
                                color: "#B45309",
                                fontSize: "11px",
                                fontWeight: "700",
                                marginBottom: "2px",
                              }}
                            >
                              {u.badgeNumber || "BADGE-PENDING"}
                            </span>
                            <div style={{ fontSize: "11px", color: colors.textMuted }}>
                              Zone: {u.assignedZone || "All Sectors"}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "2px 8px",
                                  borderRadius: "6px",
                                  backgroundColor: "#EEF2FF",
                                  color: "#4F46E5",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                }}
                              >
                                LGU {u.municipality || "Dagupan"}
                              </span>
                            </div>
                            <span style={{ fontSize: "12px", color: colors.textSecondary }}>
                              {u.department || (u.municipality && u.municipality !== "Dagupan" ? `Municipal Transport (${u.municipality})` : "City Transport & Public Safety Office (CTPSO)")}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: "14px 20px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "700",
                            backgroundColor: u.isActive ? "#ECFDF5" : "#FEF2F2",
                            color: u.isActive ? "#059669" : "#DC2626",
                          }}
                        >
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              backgroundColor: u.isActive ? "#059669" : "#DC2626",
                            }}
                          />
                          {u.isActive ? "ACTIVE" : "SUSPENDED"}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td style={{ padding: "14px 20px", color: colors.textMuted, fontSize: "12px" }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "14px 20px", textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                          {/* Change / Recover Password Button */}
                          <button
                            onClick={() => handleOpenPasswordModal(u)}
                            disabled={isCurrent}
                            title="Change or Recover Password"
                            style={{
                              padding: "6px 12px",
                              borderRadius: "8px",
                              border: `1px solid ${colors.border}`,
                              backgroundColor: colors.surfaceElevated || "#F8FAFC",
                              color: colors.textPrimary,
                              fontSize: "12px",
                              fontWeight: "600",
                              cursor: isCurrent ? "not-allowed" : "pointer",
                              opacity: isCurrent ? 0.5 : 1,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <KeyRound size={13} style={{ color: "#6366F1" }} />
                            <span>Password</span>
                          </button>

                          {/* Suspend / Activate Button */}
                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={isCurrent}
                            title={u.isActive ? "Suspend Account" : "Activate Account"}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "8px",
                              border: `1px solid ${u.isActive ? "#FCA5A5" : "#86EFAC"}`,
                              backgroundColor: u.isActive ? "#FEF2F2" : "#ECFDF5",
                              color: u.isActive ? "#DC2626" : "#059669",
                              fontSize: "12px",
                              fontWeight: "600",
                              cursor: isCurrent ? "not-allowed" : "pointer",
                              opacity: isCurrent ? 0.5 : 1,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <Power size={13} />
                            <span>{u.isActive ? "Suspend" : "Activate"}</span>
                          </button>

                          {/* Delete Account (Enabled & Visible after Suspending LGU account) */}
                          {!u.isActive && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              disabled={isCurrent}
                              title="Delete Suspended Account Permanently"
                              style={{
                                padding: "6px 12px",
                                borderRadius: "8px",
                                border: "1px solid #DC2626",
                                backgroundColor: "#DC2626",
                                color: "#FFFFFF",
                                fontSize: "12px",
                                fontWeight: "700",
                                cursor: isCurrent ? "not-allowed" : "pointer",
                                opacity: isCurrent ? 0.5 : 1,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                boxShadow: "0 1px 3px rgba(220, 38, 38, 0.25)",
                              }}
                            >
                              <Trash2 size={13} />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================
          ADD ACCOUNT MODAL (SCOPED)
      ====================================================== */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999999,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <div
            style={{
              backgroundColor: colors.surface,
              borderRadius: "16px",
              border: `1px solid ${colors.border}`,
              maxWidth: "520px",
              width: "100%",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              overflow: "hidden",
              animation: "fadeIn 0.2s ease-out",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                borderBottom: `1px solid ${colors.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {isAdmin ? (
                  <Building2 size={22} style={{ color: "#4F46E5" }} />
                ) : (
                  <ShieldCheck size={22} style={{ color: "#D97706" }} />
                )}
                <div>
                  <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: colors.textPrimary }}>
                    {isAdmin ? "Provision New LGU Authority Account" : "Register POSO Field Enforcer"}
                  </h3>
                  <span style={{ fontSize: "12px", color: colors.textMuted }}>
                    {isAdmin
                      ? "Create official City Transport Authority login"
                      : "Create official Road Enforcer patrol credentials"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowAddModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: colors.textMuted,
                  padding: "4px",
                  borderRadius: "6px",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} autoComplete="off">
              <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label className="form-label">First Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Juan"
                      value={createForm.firstName}
                      onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Last Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Dela Cruz"
                      value={createForm.lastName}
                      onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder={isAdmin ? "transport@dagupan.gov.ph" : "poso.officer@smartsakay.com"}
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    required
                    autoComplete="new-email"
                  />
                </div>

                <div>
                  <label className="form-label">Initial Password *</label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-input"
                      placeholder="Min. 8 characters"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      required
                      autoComplete="new-password"
                      style={{ paddingRight: "40px", width: "100%" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: "10px",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: colors.textMuted,
                        display: "flex",
                        alignItems: "center",
                        padding: "4px",
                      }}
                      title={showPassword ? "Hide password" : "Show password"}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {isAdmin ? (
                  <>
                    <div>
                      <label className="form-label">Municipality / City Jurisdiction *</label>
                      <select
                        className="form-input"
                        value={createForm.municipality}
                        onChange={(e) => {
                          const val = e.target.value;
                          const newDept =
                            val === "Dagupan"
                              ? "City Transport & Public Safety Office (CTPSO)"
                              : `Municipal Transport & Traffic Management (${val})`;
                          setCreateForm({
                            ...createForm,
                            municipality: val,
                            department: newDept,
                          });
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <option value="Dagupan">Dagupan City</option>
                        <option value="Calasiao">Calasiao (Municipality)</option>
                        <option value="Binmaley">Binmaley (Municipality)</option>
                        <option value="Lingayen">Lingayen (Capital / Municipality)</option>
                        <option value="Mangaldan">Mangaldan (Municipality)</option>
                        <option value="San Fabian">San Fabian (Municipality)</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label">Department / Agency</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="City Transport & Public Safety Office (CTPSO)"
                        value={createForm.department}
                        onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                      />
                    </div>
                  </>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label className="form-label">Badge Number *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. POSO-DAG-05"
                        value={createForm.badgeNumber}
                        onChange={(e) => setCreateForm({ ...createForm, badgeNumber: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">Assigned Zone / Sector</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Lucao / Perez Blvd"
                        value={createForm.assignedZone}
                        onChange={(e) => setCreateForm({ ...createForm, assignedZone: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div
                style={{
                  padding: "16px 24px",
                  borderTop: `1px solid ${colors.border}`,
                  backgroundColor: colors.surfaceElevated || colors.background,
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "12px",
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn"
                  disabled={submitting}
                  style={{
                    backgroundColor: colors.primary,
                    color: "#FFFFFF",
                    fontWeight: "600",
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? "Provisioning..." : (isAdmin ? "Provision LGU Account" : "Register POSO Officer")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================
          CHANGE / RECOVER PASSWORD MODAL
      ====================================================== */}
      {passwordModal.isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999999,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !passwordModal.submitting) {
              setPasswordModal((prev) => ({ ...prev, isOpen: false }));
            }
          }}
        >
          <div
            style={{
              backgroundColor: colors.surface,
              borderRadius: "16px",
              border: `1px solid ${colors.border}`,
              maxWidth: "460px",
              width: "100%",
              overflow: "hidden",
              boxShadow: "0 20px 40px -15px rgba(0,0,0,0.3)",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: `1px solid ${colors.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: colors.surfaceElevated || "#F8FAFC",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(99, 102, 241, 0.12)",
                    color: "#6366F1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: "800", color: colors.textPrimary, margin: 0 }}>
                    Change Account Password
                  </h3>
                  <p style={{ fontSize: "12px", color: colors.textSecondary, margin: "2px 0 0 0" }}>
                    Recover or reset credentials for {isAdmin ? "LGU Officer" : "Officer"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPasswordModal((prev) => ({ ...prev, isOpen: false }))}
                disabled={passwordModal.submitting}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: colors.textMuted,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px",
                  borderRadius: "6px",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitPasswordChange} style={{ padding: "24px" }}>
              {/* Target User Info Card */}
              {passwordModal.user && (
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(99, 102, 241, 0.06)",
                    border: "1px solid rgba(99, 102, 241, 0.18)",
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "700", fontSize: "13px", color: colors.textPrimary }}>
                      {passwordModal.user.firstName} {passwordModal.user.lastName}
                    </div>
                    <div style={{ fontSize: "12px", color: colors.textSecondary }}>
                      {passwordModal.user.email}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      backgroundColor: "#EEF2FF",
                      color: "#4F46E5",
                      textTransform: "uppercase",
                    }}
                  >
                    {passwordModal.user.role}
                  </span>
                </div>
              )}

              {/* Password Input */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: colors.textPrimary }}>
                    New Password *
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomPassword}
                    style={{
                      background: "none",
                      border: "none",
                      color: colors.primary,
                      fontSize: "11px",
                      fontWeight: "700",
                      cursor: "pointer",
                      padding: "0",
                      textDecoration: "underline",
                    }}
                  >
                    Generate Random
                  </button>
                </div>

                <div style={{ position: "relative" }}>
                  <input
                    type={passwordModal.showPassword ? "text" : "password"}
                    required
                    placeholder="Enter at least 6 characters"
                    value={passwordModal.newPassword}
                    onChange={(e) => setPasswordModal((prev) => ({ ...prev, newPassword: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "10px 42px 10px 14px",
                      borderRadius: "8px",
                      border: `1px solid ${colors.border}`,
                      backgroundColor: colors.surface,
                      color: colors.textPrimary,
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordModal((prev) => ({ ...prev, showPassword: !prev.showPassword }))}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: colors.textMuted,
                      cursor: "pointer",
                      padding: "0",
                    }}
                  >
                    {passwordModal.showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p style={{ fontSize: "11px", color: colors.textMuted, marginTop: "6px", lineHeight: "14px" }}>
                  Provide this new password to the LGU officer so they can immediately sign into the transit console.
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
                <button
                  type="button"
                  disabled={passwordModal.submitting}
                  onClick={() => setPasswordModal((prev) => ({ ...prev, isOpen: false }))}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    borderRadius: "8px",
                    border: `1px solid ${colors.border}`,
                    backgroundColor: "transparent",
                    color: colors.textPrimary,
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordModal.submitting || !passwordModal.newPassword}
                  style={{
                    flex: 1.5,
                    padding: "10px 16px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: colors.primary,
                    color: "#FFFFFF",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: passwordModal.submitting || !passwordModal.newPassword ? "not-allowed" : "pointer",
                    opacity: passwordModal.submitting || !passwordModal.newPassword ? 0.6 : 1,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  }}
                >
                  {passwordModal.submitting ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        type={confirmConfig.type}
        loading={confirmConfig.loading}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
      />
    </div>
  );
};

export default UsersPage;
