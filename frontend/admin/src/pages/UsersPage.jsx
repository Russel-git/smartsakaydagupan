import React, { useState, useEffect } from "react";
import { Search, UserPlus, X, Trash2 } from "lucide-react";

import { usersAPI } from "../api/services";
import ConfirmModal from "../components/common/ConfirmModal";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useTheme } from "../contexts/theme/ThemeContext";

const UsersPage = () => {
  const { colors } = useTheme();
  const { admin: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

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
    role: "admin",
  });

  const [submitting, setSubmitting] = useState(false);

  // ============================================================
  // ROLE EDIT STATE
  // ============================================================

  const [updatingRoleId, setUpdatingRoleId] = useState(null);

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
  // FETCH USERS
  // ============================================================

  const fetchUsers = async () => {
    try {
      const res = await usersAPI.getAll();

      setUsers(res.data.data || []);
    } catch (err) {
      console.error("Failed to load users:", err);

      showError(
        "Loading Failed",
        err.response?.data?.message || "Failed to load user accounts.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ============================================================
  // ROLE BADGE STYLE
  // Roles remain neutral/grey.
  // ============================================================

  const getRoleBadgeStyle = () => {
    return {
      bg: colors.card,
      text: colors.textSecondary,
      border: colors.border,
    };
  };

  // ============================================================
  // TOGGLE ACCOUNT STATUS
  // ============================================================

  const handleToggleStatus = async (user) => {
    try {
      await usersAPI.updateStatus(user._id, !user.isActive);

      showSuccess(
        "Account Updated",
        `Account for ${user.firstName} ${user.lastName} has been ${
          !user.isActive ? "activated" : "deactivated"
        }.`,
      );

      fetchUsers();
    } catch (err) {
      showError(
        "Update Failed",
        err.response?.data?.message || "Failed to update user status.",
      );
    }
  };

  // ============================================================
  // CHANGE ROLE
  // ============================================================

  const handleChangeRole = async (user, newRole) => {
    setUpdatingRoleId(user._id);

    try {
      await usersAPI.updateRole(user._id, newRole);

      showSuccess(
        "Role Updated",
        `${user.firstName} ${user.lastName}'s role was updated to ${newRole}.`,
      );

      fetchUsers();
    } catch (err) {
      showError(
        "Role Update Failed",
        err.response?.data?.message || "Could not update role.",
      );
    } finally {
      setUpdatingRoleId(null);
    }
  };

  // ============================================================
  // CREATE STAFF ACCOUNT
  // ============================================================

  const handleCreateStaff = async (e) => {
    e.preventDefault();

    if (
      !createForm.firstName ||
      !createForm.lastName ||
      !createForm.email ||
      !createForm.password
    ) {
      showError("Missing Fields", "Please complete all required fields.");
      return;
    }

    setSubmitting(true);

    try {
      await usersAPI.create(createForm);

      showSuccess(
        "Staff Account Created",
        `New ${createForm.role} account for ${createForm.firstName} ${createForm.lastName} (${createForm.email}) created.`,
      );

      setShowAddModal(false);

      setCreateForm({
        firstName: "",
        lastName: "",
        suffix: "",
        email: "",
        password: "",
        role: "admin",
      });

      fetchUsers();
    } catch (err) {
      showError(
        "Creation Failed",
        err.response?.data?.message || "Failed to create user account.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // DELETE USER
  // ============================================================

  const handleDeleteUser = (user) => {
    const fullName = `${user.firstName || ""} ${user.lastName || ""}${
      user.suffix ? " " + user.suffix : ""
    }`.trim();

    setConfirmConfig({
      isOpen: true,
      title: "Delete User Account",
      message: `Are you sure you want to permanently delete account "${fullName}" (${user.email})? This action cannot be undone.`,
      confirmText: "Delete Account",
      cancelText: "Cancel",
      type: "danger",
      loading: false,

      onConfirm: async () => {
        setConfirmConfig((prev) => ({
          ...prev,
          loading: true,
        }));

        try {
          await usersAPI.delete(user._id);

          showSuccess(
            "Account Deleted",
            `Account for ${fullName} (${user.email}) has been permanently deleted.`,
          );

          setConfirmConfig((prev) => ({
            ...prev,
            isOpen: false,
            loading: false,
          }));

          fetchUsers();
        } catch (err) {
          const errMsg =
            err.response?.data?.message || "Failed to delete user account.";

          showError("Delete Failed", errMsg);

          setConfirmConfig((prev) => ({
            ...prev,
            loading: false,
          }));
        }
      },
    });
  };

  // ============================================================
  // FILTER USERS
  // ============================================================

  const filteredUsers = users.filter((u) => {
    const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();

    const email = (u.email || "").toLowerCase();
    const searchValue = search.toLowerCase();

    const matchesSearch =
      fullName.includes(searchValue) || email.includes(searchValue);

    const matchesRole = roleFilter === "all" || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div>
      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div
        style={{
          marginBottom: "28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "26px",
              color: colors.textPrimary,
              marginBottom: "4px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span>Account Management & Governance</span>

            <span
              className="badge"
              style={{
                backgroundColor: colors.accentLight,
                color: colors.accent,
                border: `1px solid ${colors.accent}`,
                fontSize: "11px",
                fontWeight: "600",
              }}
            >
              Developer Access
            </span>
          </h1>

          <p
            style={{
              color: colors.textMuted,
              fontSize: "14px",
              margin: 0,
            }}
          >
            Superadmin directory to create administrative roles, govern
            permissions, and manage user accounts across Dagupan City.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: colors.primary,
            color: colors.white,
            border: `1px solid ${colors.primary}`,
          }}
        >
          <UserPlus size={16} />
          <span>Add Staff Account</span>
        </button>
      </div>

      {/* ======================================================
          SEARCH + FILTERS
      ====================================================== */}

      <div
        style={{
          display: "flex",
          gap: "14px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            position: "relative",
            flex: 1,
            minWidth: "260px",
            maxWidth: "380px",
          }}
        >
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
            placeholder="Search by name or email address..."
            className="form-input"
            style={{
              paddingLeft: "40px",
            }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{
            maxWidth: "200px",
          }}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="superadmin">Superadmins (Developers)</option>
          <option value="admin">Operators (Admin)</option>
          <option value="lgu">LGU Authorities</option>
          <option value="commuter">Commuters</option>
        </select>
      </div>

      {/* ======================================================
          USERS TABLE
      ====================================================== */}

      <div className="card">
        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              color: colors.textMuted,
            }}
          >
            Loading user accounts...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              color: colors.textMuted,
            }}
          >
            No user accounts found matching current filters.
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>User / Profile</th>
                  <th>Email</th>
                  <th>System Role</th>
                  <th>Verification</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((u) => {
                  const roleStyle = getRoleBadgeStyle();

                  const isCurrent = currentUser?._id === u._id;

                  const isSelfSuperAdmin = u.role === "superadmin";

                  return (
                    <tr key={u._id}>
                      {/* USER / PROFILE */}

                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <div
                            style={{
                              width: "34px",
                              height: "34px",
                              borderRadius: "50%",
                              backgroundColor: roleStyle.bg,
                              border: `1px solid ${roleStyle.border}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: "700",
                              fontSize: "13px",
                              color: roleStyle.text,
                            }}
                          >
                            {u.firstName ? u.firstName[0].toUpperCase() : "U"}
                          </div>

                          <div>
                            <span
                              style={{
                                fontWeight: "600",
                                color: colors.textPrimary,
                                display: "block",
                              }}
                            >
                              {u.firstName} {u.lastName}
                              {u.suffix ? ` ${u.suffix}` : ""}
                            </span>

                            {isCurrent && (
                              <span
                                style={{
                                  fontSize: "10px",
                                  color: colors.accent,
                                  fontWeight: "bold",
                                }}
                              >
                                (Current Session)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* EMAIL */}

                      <td
                        style={{
                          color: colors.textMuted,
                        }}
                      >
                        {u.email}
                      </td>

                      {/* ROLE */}

                      <td>
                        <select
                          value={u.role}
                          disabled={isCurrent && isSelfSuperAdmin}
                          onChange={(e) => handleChangeRole(u, e.target.value)}
                          className="form-select"
                          style={{
                            padding: "4px 8px",
                            fontSize: "12px",
                            backgroundColor: colors.surface,
                            color: colors.primary,
                            borderColor: colors.primary,
                            borderRadius: "6px",
                            cursor:
                              isCurrent && isSelfSuperAdmin
                                ? "not-allowed"
                                : "pointer",
                            opacity: updatingRoleId === u._id ? 0.6 : 1,
                            fontWeight: "600",
                          }}
                        >
                          <option value="superadmin">Superadmin</option>

                          <option value="admin">Operator (Admin)</option>

                          <option value="lgu">LGU Authority</option>

                          <option value="commuter">Commuter</option>
                        </select>
                      </td>

                      {/* VERIFICATION */}

                      <td>
                        {u.isVerified ? (
                          <span
                            className="badge"
                            style={{
                              backgroundColor: colors.successLight,
                              color: colors.success,
                              border: `1px solid ${colors.success}`,
                            }}
                          >
                            ✓ Verified
                          </span>
                        ) : (
                          <span
                            className="badge"
                            style={{
                              backgroundColor: colors.warningLight,
                              color: colors.warning,
                              border: `1px solid ${colors.warning}`,
                            }}
                          >
                            Unverified
                          </span>
                        )}
                      </td>

                      {/* STATUS */}

                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: u.isActive
                              ? colors.warningLight
                              : colors.primary,

                            color: u.isActive ? colors.warning : colors.white,

                            border: `1px solid ${
                              u.isActive ? colors.warning : colors.primary
                            }`,
                          }}
                        >
                          ● {u.isActive ? "Active" : "Suspended"}
                        </span>
                      </td>

                      {/* REGISTERED */}

                      <td
                        style={{
                          fontSize: "12px",
                          color: colors.textMuted,
                        }}
                      >
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      {/* ACTIONS */}

                      <td>
                        {!isCurrent && (
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              alignItems: "center",
                            }}
                          >
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className="btn btn-sm"
                              style={{
                                backgroundColor: u.isActive
                                  ? colors.warningLight
                                  : colors.primary,

                                color: u.isActive
                                  ? colors.warning
                                  : colors.white,

                                border: `1px solid ${
                                  u.isActive ? colors.warning : colors.primary
                                }`,
                              }}
                              title={
                                u.isActive
                                  ? "Suspend account access"
                                  : "Reactivate account"
                              }
                            >
                              {u.isActive ? "Deactivate" : "Activate"}
                            </button>

                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="btn btn-sm"
                              style={{
                                backgroundColor: colors.dangerLight,
                                color: colors.danger,
                                border: `1px solid ${colors.danger}`,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "6px 10px",
                                cursor: "pointer",
                              }}
                              title="Permanently remove account"
                            >
                              <Trash2 size={13} />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
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
          ADD STAFF ACCOUNT MODAL
      ====================================================== */}

      {showAddModal && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{
              maxWidth: "480px",
              backgroundColor: colors.surface,
              color: colors.textPrimary,
            }}
          >
            <div className="modal-header">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <UserPlus size={20} color={colors.primary} />

                <h2
                  style={{
                    fontSize: "18px",
                    margin: 0,
                    color: colors.textPrimary,
                  }}
                >
                  Create Staff Account
                </h2>
              </div>

              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setShowAddModal(false)}
                style={{
                  color: colors.textSecondary,
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateStaff}>
              <div
                className="modal-body"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                {/* FIRST + LAST NAME */}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div>
                    <label className="form-label">First Name *</label>

                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Maria"
                      value={createForm.firstName}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          firstName: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Last Name *</label>

                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Dela Cruz-Santos"
                      value={createForm.lastName}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          lastName: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                {/* SUFFIX + ROLE */}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div>
                    <label className="form-label">Suffix (Optional)</label>

                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Jr., III"
                      value={createForm.suffix}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          suffix: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="form-label">Assigned Role *</label>

                    <select
                      className="form-select"
                      value={createForm.role}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          role: e.target.value,
                        })
                      }
                      style={{
                        borderColor: colors.primary,
                        color: colors.primary,
                      }}
                    >
                      <option value="admin">Operator (Admin)</option>

                      <option value="lgu">LGU Authority (POSO)</option>

                      <option value="superadmin">Superadmin (Developer)</option>
                    </select>
                  </div>
                </div>

                {/* EMAIL */}

                <div>
                  <label className="form-label">Email Address *</label>

                  <input
                    type="email"
                    className="form-input"
                    placeholder="officer@dagupan.gov.ph"
                    value={createForm.email}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        email: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                {/* PASSWORD */}

                <div>
                  <label className="form-label">Initial Password *</label>

                  <input
                    type="password"
                    className="form-input"
                    placeholder="Min. 8 characters"
                    value={createForm.password}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        password: e.target.value,
                      })
                    }
                    required
                  />

                  <span
                    style={{
                      fontSize: "11px",
                      color: colors.textMuted,
                      marginTop: "4px",
                      display: "block",
                    }}
                  >
                    Staff member will use these credentials to access the
                    console.
                  </span>
                </div>
              </div>

              {/* MODAL FOOTER */}

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
                    color: colors.white,
                    border: `1px solid ${colors.primary}`,
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? "Creating Account..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================
          CONFIRMATION MODAL
      ====================================================== */}

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        type={confirmConfig.type}
        loading={confirmConfig.loading}
        onClose={() =>
          setConfirmConfig((prev) => ({
            ...prev,
            isOpen: false,
          }))
        }
        onConfirm={confirmConfig.onConfirm}
      />
    </div>
  );
};

export default UsersPage;
