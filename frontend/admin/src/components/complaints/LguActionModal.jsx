import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, X, AlertCircle } from 'lucide-react';

const LguActionModal = ({ isOpen, mode = 'action', complaint, onClose, onConfirm, loading }) => {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (complaint) {
      if (mode === 'action') {
        setNotes(complaint.lguActionNotes || '');
      } else {
        setNotes(complaint.lguTerminationNotes || '');
      }
    }
  }, [complaint, mode, isOpen]);

  if (!isOpen || !complaint) return null;

  const isAction = mode === 'action';

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(complaint, mode, notes);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isAction ? (
              <ShieldCheck size={20} color="#10b981" />
            ) : (
              <CheckCircle2 size={20} color="#38bdf8" />
            )}
            <h2 style={{ fontSize: '18px', margin: 0, color: 'white' }}>
              {isAction ? 'Record Official LGU Action' : 'Terminate & Resolve Case'}
            </h2>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} disabled={loading}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                backgroundColor: isAction ? 'rgba(16, 185, 129, 0.1)' : 'rgba(56, 189, 248, 0.1)',
                border: `1px solid ${isAction ? 'rgba(16, 185, 129, 0.25)' : 'rgba(56, 189, 248, 0.25)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '12px',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'white', marginBottom: '2px' }}>
                Case No: {complaint.lguCaseNumber || `LGU-DAG-${complaint._id.toString().slice(-6).toUpperCase()}`}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Citizen Report: "{complaint.subject}" ({complaint.vehiclePlateNumber || 'Plate Unspecified'})
              </div>
            </div>

            <div>
              <label className="form-label">
                {isAction ? 'Official Enforcement Findings & Action Taken *' : 'Case Termination Summary & Final Resolution *'}
              </label>
              <textarea
                className="form-input"
                rows={4}
                required
                placeholder={
                  isAction
                    ? 'e.g. Driver summoned to POSO Dagupan; Traffic Citation Ticket #4821 issued for overcharging; cooperative informed.'
                    : 'e.g. Citation penalty settled by driver; operator issued formal warning; commuter informed and case officially closed.'
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                This official finding will be permanently recorded and transmitted in real-time to the commuter's device.
              </span>
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
                backgroundColor: isAction ? '#10b981' : '#0284c7',
                color: 'white',
                border: 'none',
                fontWeight: '600',
              }}
            >
              {loading
                ? 'Saving Record...'
                : isAction
                ? 'Save Action Record'
                : 'Confirm Termination'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LguActionModal;
