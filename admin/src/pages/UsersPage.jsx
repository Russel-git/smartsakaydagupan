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
  Trash2
} from 'lucide-react';
import api from '../api/client';
import ConfirmModal from '../components/common/ConfirmModal';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [message, setMessage] = useState(null);
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
      setMessage({
        type: 'success',
        text: `Account for ${user.firstName} ${user.lastName} has been ${!user.isActive ? 'activated' : 'deactivated'}.`,
      });
      fetchUsers();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update user status.' });
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
          setMessage({
            type: 'success',
            text: `Account for ${fullName} (${user.email}) has been permanently deleted.`,
          });
          setConfirmConfig((prev) => ({ ...prev, isOpen: false, loading: false }));
          fetchUsers();
        } catch (err) {
          const errMsg = err.response?.data?.message || 'Failed to delete user account.';
          setMessage({ type: 'error', text: errMsg });
          setConfirmConfig((prev) => ({ ...prev, loading: false }));
        }
      },
    });
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
      <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '26px', color: '#ffffff', marginBottom: '4px' }}>Commuter & User Directory</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Manage registered commuter profiles, verify credentials, and govern access.
          </p>
        </div>
      </div>

      {message && (
        <div style={{
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '12px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: message.type === 'success' ? '#34d399' : '#f87171',
          fontSize: '13px',
        }}>
          {message.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '20px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '380px' }}>
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
          style={{ maxWidth: '180px' }}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="commuter">Commuters</option>
          <option value="admin">Administrators</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="card">
        {filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            No users found matching current filters.
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Commuter / User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Email Verified</th>
                  <th>Account Status</th>
                  <th>Registered</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: 'var(--radius-full)',
                          background: u.role === 'admin' ? 'var(--primary)' : 'var(--bg-surface-elevated)',
                          border: '1px solid var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                          fontSize: '12px',
                          color: 'white',
                        }}>
                          {u.firstName ? u.firstName[0].toUpperCase() : 'U'}
                        </div>
                        <span style={{ fontWeight: '600', color: 'white' }}>
                          {u.firstName} {u.lastName}{u.suffix ? ` ${u.suffix}` : ''}
                        </span>

                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-info' : 'badge-secondary'}`}>
                        {u.role === 'admin' ? 'Admin' : 'Commuter'}
                      </span>
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
                      {u.role !== 'admin' ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`btn btn-sm ${u.isActive ? 'btn-secondary' : 'btn-primary'}`}
                            title={u.isActive ? 'Deactivate account' : 'Reactivate account'}
                          >
                            {u.isActive ? 'Deactivate' : 'Reactivate'}
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
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                          Protected
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modern UI/UX Confirmation Modal */}
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
