import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Eye, 
  Filter, 
  MessageSquare, 
  MapPin, 
  Car, 
  X, 
  Check,
  Send,
  Building2,
  ShieldCheck,
  FileText
} from 'lucide-react';
import api from '../api/client';
import { useToast } from '../contexts/ToastContext';

const ComplaintsPage = () => {
  const { showSuccess, showError, showInfo } = useToast();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [adminNotes, setAdminNotes] = useState('');
  const [ltfrbCaseNumber, setLtfrbCaseNumber] = useState('');
  const [ltfrbNotes, setLtfrbNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchComplaints = async () => {
    try {
      const { data } = await api.get('/complaints');
      setComplaints(data.data || []);
    } catch (err) {
      console.error('Error fetching complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleOpenModal = (complaint) => {
    setSelectedComplaint(complaint);
    setNewStatus(complaint.status);
    setAdminNotes(complaint.adminNotes || '');
    setLtfrbCaseNumber(
      complaint.ltfrbCaseNumber || 
      `LTFRB-R1-DAG-${new Date().getFullYear()}-${complaint._id.toString().slice(-6).toUpperCase()}`
    );
    setLtfrbNotes(
      complaint.ltfrbNotes || 
      'Verified violation report forwarded to Land Transportation Franchising and Regulatory Board (LTFRB) Region 1 and Dagupan POSO for administrative review.'
    );
    setMessage(null);
  };

  const handleQuickEndorseLTFRB = () => {
    setNewStatus('endorsed_to_ltfrb');
    showInfo(
      'LTFRB Endorsement Ready',
      'Status set to "Endorsed to LTFRB". Review case reference number and verification notes, then click Save Resolution.'
    );
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!selectedComplaint) return;
    setSaving(true);
    try {
      await api.put(`/complaints/${selectedComplaint._id}/status`, {
        status: newStatus,
        adminNotes,
        ltfrbCaseNumber: newStatus === 'endorsed_to_ltfrb' ? ltfrbCaseNumber : undefined,
        ltfrbNotes: newStatus === 'endorsed_to_ltfrb' ? ltfrbNotes : undefined,
      });

      showSuccess(
        newStatus === 'endorsed_to_ltfrb' ? 'Endorsed to LTFRB Region 1' : 'Complaint Updated',
        `Case ticket marked as "${newStatus.replace(/_/g, ' ')}". Status saved and commuter notified.`
      );
      setMessage({ type: 'success', text: 'Complaint status and resolution updated.' });
      setSelectedComplaint(null);
      fetchComplaints();
    } catch (err) {
      const errText = err.response?.data?.message || 'Failed to update complaint.';
      showError('Update Failed', errText);
      setMessage({ type: 'error', text: errText });
    } finally {
      setSaving(false);
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
    return matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="badge badge-warning">● Pending</span>;
      case 'under_review':
        return <span className="badge badge-info">● Under Review</span>;
      case 'endorsed_to_ltfrb':
        return (
          <span 
            className="badge" 
            style={{ 
              backgroundColor: 'rgba(139, 92, 246, 0.25)', 
              color: '#C4B5FD', 
              border: '1px solid rgba(139, 92, 246, 0.45)',
              fontWeight: '700'
            }}
          >
            🏛️ Endorsed to LTFRB
          </span>
        );
      case 'resolved':
        return <span className="badge badge-success">● Resolved</span>;
      case 'dismissed':
        return <span className="badge badge-danger">● Dismissed</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '26px', color: '#ffffff', marginBottom: '4px' }}>Commuter Complaints & Grievances</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Investigate reported PUV overcharging, safety violations, and endorse verified cases to LTFRB Region 1 & Dagupan POSO.
          </p>
        </div>
      </div>

      {message && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${message.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
          color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
          fontSize: '14px'
        }}>
          {message.text}
        </div>
      )}

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <select
          className="form-select"
          style={{ maxWidth: '220px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="endorsed_to_ltfrb">🏛️ Endorsed to LTFRB</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>

        <select
          className="form-select"
          style={{ maxWidth: '220px' }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="overcharging">Overcharging</option>
          <option value="reckless_driving">Reckless Driving</option>
          <option value="harassment">Harassment</option>
          <option value="route_deviation">Route Deviation</option>
          <option value="vehicle_condition">Vehicle Condition</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Complaints Table */}
      <div className="card">
        {filteredComplaints.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
            No commuter complaints matching current filters.
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Subject</th>
                  <th>Plate # / Ref</th>
                  <th>Reported By</th>
                  <th>Status</th>
                  <th>Date Filed</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <span style={{ 
                        textTransform: 'capitalize', 
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'var(--primary-light)'
                      }}>
                        {c.category?.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ fontWeight: '600', color: '#ffffff' }}>
                      <div>{c.subject}</div>
                      {c.ltfrbCaseNumber && (
                        <div style={{ fontSize: '11px', color: '#A78BFA', marginTop: '2px', fontWeight: '500' }}>
                          Ref: {c.ltfrbCaseNumber}
                        </div>
                      )}
                    </td>
                    <td>
                      {c.vehiclePlateNumber || c.plateNumber ? (
                        <span style={{ 
                          fontFamily: 'monospace', 
                          background: 'rgba(255,255,255,0.06)', 
                          padding: '3px 6px', 
                          borderRadius: '4px',
                          color: '#FBBF24',
                          fontWeight: '700'
                        }}>
                          {c.vehiclePlateNumber || c.plateNumber}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>None</span>
                      )}
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {c.userId?.firstName ? `${c.userId.firstName} ${c.userId.lastName}` : 'Commuter'}
                    </td>
                    <td>{getStatusBadge(c.status)}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        onClick={() => handleOpenModal(c)}
                        className="btn btn-secondary btn-sm"
                        title="Review and Endorse Complaint"
                      >
                        <Eye size={14} />
                        <span>Review</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Complaint Review Modal */}
      {selectedComplaint && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ color: '#ffffff', fontSize: '18px' }}>
                  {selectedComplaint.subject}
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--primary-light)' }}>
                  Category: {selectedComplaint.category?.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                style={{ background: 'transparent', color: 'var(--text-dim)', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                {/* Description Box */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  marginBottom: '16px',
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Commuter Statement
                  </div>
                  <p style={{ fontSize: '14px', color: '#ffffff', lineHeight: '1.6' }}>
                    {selectedComplaint.description}
                  </p>
                </div>

                {/* Metadata Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '12px' }}>
                      <Car size={14} />
                      <span>Vehicle / Route</span>
                    </div>
                    <div style={{ fontWeight: '600', color: 'white', marginTop: '4px' }}>
                      {selectedComplaint.vehiclePlateNumber || selectedComplaint.plateNumber ? (
                        `Plate: ${selectedComplaint.vehiclePlateNumber || selectedComplaint.plateNumber}`
                      ) : (
                        'Plate not specified'
                      )}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '12px' }}>
                      <Clock size={14} />
                      <span>Filed Date</span>
                    </div>
                    <div style={{ fontWeight: '600', color: 'white', marginTop: '4px' }}>
                      {new Date(selectedComplaint.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Quick LTFRB Endorsement Action Banner */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(79, 70, 229, 0.1) 100%)',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#DDD6FE', fontWeight: '700', fontSize: '13px' }}>
                      <Building2 size={16} color="#A78BFA" />
                      <span>LTFRB Official Endorsement System</span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '3px' }}>
                      Directly verify this complaint and route it to LTFRB Region 1 & Dagupan POSO for administrative summons.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickEndorseLTFRB}
                    className="btn btn-sm"
                    style={{
                      backgroundColor: '#7C3AED',
                      color: '#ffffff',
                      border: 'none',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <ShieldCheck size={14} />
                    <span>Verify & Endorse</span>
                  </button>
                </div>

                {/* Status Update Form */}
                <div className="form-group">
                  <label className="form-label">Complaint Status</label>
                  <select
                    className="form-select"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <option value="pending">Pending Investigation</option>
                    <option value="under_review">Under Review (Admin Verification)</option>
                    <option value="endorsed_to_ltfrb">🏛️ Endorsed to LTFRB Region 1 & POSO</option>
                    <option value="resolved">Resolved & Closed</option>
                    <option value="dismissed">Dismissed (Insufficient Evidence)</option>
                  </select>
                </div>

                {/* Conditional LTFRB Fields */}
                {newStatus === 'endorsed_to_ltfrb' && (
                  <div style={{
                    background: 'rgba(124, 58, 237, 0.08)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    marginBottom: '16px',
                  }}>
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label className="form-label" style={{ color: '#DDD6FE' }}>
                        LTFRB Official Case Tracking Number
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. LTFRB-R1-DAG-2026-0042"
                        value={ltfrbCaseNumber}
                        onChange={(e) => setLtfrbCaseNumber(e.target.value)}
                        style={{ fontFamily: 'monospace', fontWeight: '600' }}
                      />
                      <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                        This reference number is sent to the commuter so they can track their hearing and summons progress with LTFRB.
                      </span>
                    </div>

                    <div className="form-group" style={{ marginBottom: '0' }}>
                      <label className="form-label" style={{ color: '#DDD6FE' }}>
                        LTFRB Verification & Referral Notes
                      </label>
                      <textarea
                        rows={3}
                        className="form-textarea"
                        placeholder="Enter verified violation facts, recommended sanctions, or forwarding instructions for LTFRB..."
                        value={ltfrbNotes}
                        onChange={(e) => setLtfrbNotes(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Internal Administrator Notes</label>
                  <textarea
                    rows={3}
                    className="form-textarea"
                    placeholder="Enter internal staff notes, contact logs with operator/driver, or POSO coordination..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="btn btn-secondary"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                  style={{
                    backgroundColor: newStatus === 'endorsed_to_ltfrb' ? '#7C3AED' : undefined,
                  }}
                >
                  {saving ? 'Saving Changes...' : newStatus === 'endorsed_to_ltfrb' ? 'Endorse & Notify Commuter' : 'Save Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintsPage;
