import React, { useState } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

const REASON_OPTIONS = [
  'Spam / False Information',
  'Duplicate Complaint',
  'Inappropriate / Abusive Content',
  'Insufficient Evidence / Details',
  'Resolved Informally',
  'Other',
];

const DeleteReasonModal = ({ isOpen, complaint, onClose, onConfirm, loading }) => {
  const [reason, setReason] = useState(REASON_OPTIONS[0]);
  const [notes, setNotes] = useState('');

  if (!isOpen || !complaint) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(complaint, reason, notes);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '460px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
            <Trash2 size={20} />
            <h2 style={{ fontSize: '18px', margin: 0, color: 'white' }}>Delete Complaint Report</h2>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} disabled={loading}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                display: 'flex',
                gap: '10px',
              }}
            >
              <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '12px', color: '#fca5a5', lineHeight: '1.4' }}>
                Discarding report <strong>"{complaint.subject}"</strong>. To maintain administrative transparency, an official reason must be selected for audit logs.
              </div>
            </div>

            <div>
              <label className="form-label">Reason for Deletion *</label>
              <select
                className="form-select"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              >
                {REASON_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Administrative Notes (Optional)</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Explain why this grievance was discarded..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn"
              disabled={loading}
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                fontWeight: '600',
              }}
            >
              {loading ? 'Deleting Report...' : 'Confirm Deletion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeleteReasonModal;
