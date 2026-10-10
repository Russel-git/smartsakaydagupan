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
    department: isAdmin ? "City Transport & Public Safety Office (CTPSO)" : "Public Order & Safety Office (POSO)",
    badgeNumber: "",
    assignedZone: "",
  });

  const [submitting, setSubmitting] = useState(false);

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
                          <span style={{ fontSize: "12px", color: colors.textSecondary }}>
                            {u.department || "City Transport & Public Safety Office (CTPSO)"}
                          </span>
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
                          <Power size={14} />
                          <span>{u.isActive ? "Suspend" : "Activate"}</span>
                        </button>
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
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: "520px" }}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {isAdmin ? (
                  <Building2 size={20} style={{ color: "#4F46E5" }} />
                ) : (
                  <ShieldCheck size={20} style={{ color: "#D97706" }} />
                )}
                <h3 className="modal-title" style={{ margin: 0 }}>
                  {isAdmin ? "Provision New LGU Authority Account" : "Register POSO Field Enforcer"}
                </h3>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowAddModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateStaff}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
                  />
                </div>

                <div>
                  <label className="form-label">Initial Password *</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Min. 8 characters"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    required
                  />
                </div>

                {isAdmin ? (
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

              <div className="modal-footer">
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
