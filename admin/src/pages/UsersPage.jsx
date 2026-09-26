import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Shield, 
  UserCheck, 
  UserX, 
  Check, 
  AlertCircle, 
  Mail, 
  Trash2, 
  UserPlus, 
  X,
  Key,
  Building2,
  ShieldAlert
} from 'lucide-react';
import api from '../api/client';
import ConfirmModal from '../components/common/ConfirmModal';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const UsersPage = () => {
  const { admin: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [message, setMessage] = useState(null);

  // Add User Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    firstName: '',
    lastName: '',
    suffix: '',
    email: '',
    password: '',
    role: 'admin',
  });
  const [submitting, setSubmitting] = useState(false);

  // Role Edit State
  const [updatingRoleId, setUpdatingRoleId] = useState(null);

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'danger',
    loading: false,
    onConfirm: () => {},
  });

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user) => {
    try {
      await api.put(`/users/${user._id}/status`, { isActive: !user.isActive });
      showSuccess(
        'Account Updated',
        `Account for ${user.firstName} ${user.lastName} has been ${!user.isActive ? 'activated' : 'deactivated'}.`
      );
      fetchUsers();
    } catch (err) {
      showError('Update Failed', 'Failed to update user status.');
    }
  };

  const handleChangeRole = async (user, newRole) => {
    setUpdatingRoleId(user._id);
    try {
      await api.put(`/users/${user._id}/role`, { role: newRole });
      showSuccess('Role Updated', `${user.firstName} ${user.lastName}'s role was updated to ${newRole}.`);
      fetchUsers();
    } catch (err) {
      showError('Role Update Failed', err.response?.data?.message || 'Could not update role.');
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!createForm.firstName || !createForm.lastName || !createForm.email || !createForm.password) {
      showError('Missing Fields', 'Please complete all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/users', createForm);
      showSuccess(
        'Staff Account Created',
        `New ${createForm.role} account for ${createForm.firstName} ${createForm.lastName} (${createForm.email}) created.`
      );
      setShowAddModal(false);
      setCreateForm({
        firstName: '',
        lastName: '',
        suffix: '',
        email: '',
        password: '',
        role: 'admin',
      });
      fetchUsers();
    } catch (err) {
      showError('Creation Failed', err.response?.data?.message || 'Failed to create user account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = (user) => {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}${user.suffix ? ' ' + user.suffix : ''}`.trim();
    setConfirmConfig({
      isOpen: true,
      title: 'Delete User Account',
      message: `Are you sure you want to permanently delete account "${fullName}" (${user.email})? This action cannot be undone.`,
      confirmText: 'Delete Account',
      cancelText: 'Cancel',
      type: 'danger',
      loading: false,
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, loading: true }));
        try {
          await api.delete(`/users/${user._id}`);
          showSuccess('Account Deleted', `Account for ${fullName} (${user.email}) has been permanently deleted.`);
          setConfirmConfig((prev) => ({ ...prev, isOpen: false, loading: false }));
          fetchUsers();
        } catch (err) {
          const errMsg = err.response?.data?.message || 'Failed to delete user account.';
          showError('Delete Failed', errMsg);
          setConfirmConfig((prev) => ({ ...prev, loading: false }));
        }
      },
    });
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'superadmin':
        return { bg: 'rgba(139, 92, 246, 0.15)', text: '#a78bfa', border: 'rgba(139, 92, 246, 0.3)', label: 'Superadmin' };
      case 'admin':
        return { bg: 'rgba(6, 182, 212, 0.15)', text: '#22d3ee', border: 'rgba(6, 182, 212, 0.3)', label: 'Operator' };
      case 'lgu':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)', label: 'LGU Authority' };
      default:
        return { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)', label: 'Commuter' };
    }
  };

  const filteredUsers = users.filter((u) => {
    const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    const matchesSearch = fullName.includes(search.toLowerCase()) || 
                          u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div>
      <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', color: '#ffffff', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>Account Management & Governance</span>
            <span
              className="badge"
              style={{
                backgroundColor: 'rgba(139, 92, 246, 0.15)',
                color: '#c084fc',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                fontSize: '11px',
                fontWeight: '600',
              }}
            >
              Developer Access
            </span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Superadmin directory to create administrative roles, govern permissions, and manage user accounts across Dagupan City.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <UserPlus size={16} />
          <span>Add Staff Account</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px', maxWidth: '380px' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-dim)' }} />
          <input
            type="text"
            placeholder="Search by name or email address..."
            className="form-input"
            style={{ paddingLeft: '40px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ maxWidth: '200px' }}
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

      {/* Users Table */}
      <div className="card">
        {filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
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
                  const roleStyle = getRoleBadgeStyle(u.role);
                  const isCurrent = currentUser?._id === u._id;
                  const isSelfSuperAdmin = u.role === 'superadmin';

                  return (
                    <tr key={u._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: 'var(--radius-full)',
                            background: roleStyle.bg,
                            border: `1px solid ${roleStyle.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '700',
                            fontSize: '13px',
                            color: roleStyle.text,
                          }}>
                            {u.firstName ? u.firstName[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <span style={{ fontWeight: '600', color: 'white', display: 'block' }}>
                              {u.firstName} {u.lastName}{u.suffix ? ` ${u.suffix}` : ''}
                            </span>
                            {isCurrent && (
                              <span style={{ fontSize: '10px', color: '#c084fc', fontWeight: 'bold' }}>
                                (Current Session)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                      <td>
                        <select
                          value={u.role}
                          disabled={isCurrent && isSelfSuperAdmin}
                          onChange={(e) => handleChangeRole(u, e.target.value)}
                          className="form-select"
                          style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            background: roleStyle.bg,
                            color: roleStyle.text,
                            borderColor: roleStyle.border,
                            borderRadius: '6px',
                            cursor: isCurrent && isSelfSuperAdmin ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <option value="superadmin">Superadmin</option>
                          <option value="admin">Operator (Admin)</option>
                          <option value="lgu">LGU Authority</option>
                          <option value="commuter">Commuter</option>
                        </select>
                      </td>
                      <td>
                        {u.isVerified ? (
                          <span className="badge badge-success">✓ Verified</span>
                        ) : (
                          <span className="badge badge-warning">Unverified</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                          ● {u.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        {!isCurrent && (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`btn btn-sm ${u.isActive ? 'btn-secondary' : 'btn-primary'}`}
                              title={u.isActive ? 'Suspend account access' : 'Reactivate account'}
                            >
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="btn btn-sm"
                              style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 10px',
                                cursor: 'pointer',
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

      {/* Add Staff Account Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={20} color="var(--primary)" />
                <h2 style={{ fontSize: '18px', margin: 0, color: 'white' }}>Create Staff Account</h2>
              </div>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setShowAddModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateStaff}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">First Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Maria"
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
                      placeholder="e.g. Dela Cruz-Santos"
                      value={createForm.lastName}
                      onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Suffix (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Jr., III"
                      value={createForm.suffix}
                      onChange={(e) => setCreateForm({ ...createForm, suffix: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Assigned Role *</label>
                    <select
                      className="form-select"
                      value={createForm.role}
                      onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    >
                      <option value="admin">Operator (Admin)</option>
                      <option value="lgu">LGU Authority (POSO)</option>
                      <option value="superadmin">Superadmin (Developer)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="officer@dagupan.gov.ph"
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
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                    Staff member will use these credentials to access the console.
                  </span>
                </div>
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
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Creating Account...' : 'Create Account'}
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
