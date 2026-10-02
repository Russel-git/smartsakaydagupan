import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  RotateCcw, 
  Clock, 
  User, 
  FileText, 
  Eye, 
  CheckCircle, 
  AlertTriangle,
  Lock,
  Database,
  Server
} from 'lucide-react';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = { page, limit: 15 };
      if (actionFilter) params.action = actionFilter;
      if (resourceFilter) params.resourceType = resourceFilter;

      const res = await axios.get('http://localhost:5000/api/admin/audit-logs', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      if (res.data?.success) {
        setLogs(res.data.data.logs || []);
        setPagination(res.data.data.pagination || { total: 0, pages: 1 });
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, resourceFilter]);

  const getActionBadgeColor = (action) => {
    if (action.includes('UPDATE')) return '#F59E0B';
    if (action.includes('CREATE')) return '#10B981';
    if (action.includes('DELETE')) return '#EF4444';
    if (action.includes('LOGIN')) return '#3B82F6';
    return '#8B5CF6';
  };

  return (
    <div>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={26} color="var(--primary-light)" />
            Security & System Audit Logs
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '14px' }}>
            Immutable administrative event trace adhering to Backend Security Control G (Logging & Monitoring)
          </p>
        </div>
        <button 
          onClick={fetchLogs} 
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <RotateCcw size={16} />
          <span>Refresh Trace</span>
        </button>
      </div>

      {/* Security Architecture Summary Card */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(26, 86, 219, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Lock size={20} color="var(--primary-light)" />
          <div>
            <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)' }}>
              Controls A–G Enforced: Floor & Ceiling Active
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Validation • Parameter Binding • Bcrypt • JWT & Signed OTP • RBAC • Encryption • Audit Logging
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span className="badge badge-success">Total Records: {pagination.total}</span>
          <span className="badge badge-primary">Retention: 365 Days</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{ 
        background: 'var(--bg-card)', 
        border: '1px solid var(--border-color)', 
        borderRadius: '10px', 
        padding: '16px',
        marginBottom: '20px',
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '200px' }}>
          <Filter size={18} color="var(--text-muted)" />
          <select 
            value={actionFilter} 
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            style={{
              background: 'var(--bg-dark)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              padding: '8px 12px',
              borderRadius: '6px',
              width: '100%',
              fontSize: '13px'
            }}
          >
            <option value="">All Audit Actions</option>
            <option value="FARE_UPDATE">Fare Matrix Update</option>
            <option value="ROUTE_CREATE">Route Creation</option>
            <option value="ROUTE_UPDATE">Route Modification</option>
            <option value="ROUTE_DELETE">Route Deactivation</option>
            <option value="COMPLAINT_STATUS_UPDATE">Complaint Status Change</option>
            <option value="COMPLAINT_NOTE_ADDED">Complaint Note Added</option>
            <option value="USER_STATUS_UPDATE">User Account Status</option>
            <option value="ADMIN_LOGIN">Admin Authentication</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '200px' }}>
          <Database size={18} color="var(--text-muted)" />
          <select 
            value={resourceFilter} 
            onChange={(e) => { setResourceFilter(e.target.value); setPage(1); }}
            style={{
              background: 'var(--bg-dark)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              padding: '8px 12px',
              borderRadius: '6px',
              width: '100%',
              fontSize: '13px'
            }}
          >
            <option value="">All Resource Scopes</option>
            <option value="fare">Fares & Rates</option>
            <option value="route">Transit Routes</option>
            <option value="complaint">Commuter Complaints</option>
            <option value="user">User Accounts</option>
            <option value="auth">Authentication</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '14px 18px', color: 'var(--text-muted)', fontWeight: '600' }}>Timestamp</th>
                <th style={{ padding: '14px 18px', color: 'var(--text-muted)', fontWeight: '600' }}>Action Event</th>
                <th style={{ padding: '14px 18px', color: 'var(--text-muted)', fontWeight: '600' }}>Target Scope</th>
                <th style={{ padding: '14px 18px', color: 'var(--text-muted)', fontWeight: '600' }}>Admin Operator</th>
                <th style={{ padding: '14px 18px', color: 'var(--text-muted)', fontWeight: '600' }}>IP Address</th>
                <th style={{ padding: '14px 18px', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'right' }}>Inspection</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading audit trail from database...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No audit log records match the selected filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr 
                    key={log._id} 
                    style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 18px', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} />
                        <span>{new Date(log.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ 
                        background: `${getActionBadgeColor(log.action)}18`,
                        color: getActionBadgeColor(log.action),
                        border: `1px solid ${getActionBadgeColor(log.action)}40`,
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '700',
                        letterSpacing: '0.5px'
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ textTransform: 'capitalize', color: 'var(--text-main)', fontWeight: '600' }}>
                        {log.resourceType}
                      </span>
                      {log.resourceId && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>
                          (#{String(log.resourceId).slice(-6)})
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{log.performedByName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.performedByEmail || log.role}</div>
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '12px' }}>
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <button 
                        onClick={() => setSelectedLog(log)}
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-main)',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px'
                        }}
                      >
                        <Eye size={14} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Page {pagination.page} of {pagination.pages} ({pagination.total} total events)
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                disabled={page <= 1} 
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                Previous
              </button>
              <button 
                disabled={page >= pagination.pages} 
                onClick={() => setPage((p) => p + 1)}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inspector Modal */}
      {selectedLog && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} color="var(--primary-light)" />
                Audit Event Record Details
              </h3>
              <button 
                onClick={() => setSelectedLog(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px', fontSize: '13px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Action:</span>
                <div style={{ fontWeight: '700', color: 'var(--text-main)', marginTop: '2px' }}>{selectedLog.action}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Scope:</span>
                <div style={{ fontWeight: '700', color: 'var(--text-main)', marginTop: '2px' }}>{selectedLog.resourceType}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Operator:</span>
                <div style={{ fontWeight: '600', color: 'var(--text-main)', marginTop: '2px' }}>{selectedLog.performedByName}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Timestamp:</span>
                <div style={{ color: 'var(--text-main)', marginTop: '2px' }}>{new Date(selectedLog.createdAt).toISOString()}</div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600' }}>Event Payload / Mutation Diff:</span>
              <pre style={{
                background: 'var(--bg-dark)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '14px',
                fontSize: '12px',
                color: '#34D399',
                overflowX: 'auto',
                marginTop: '8px',
                lineHeight: '1.5'
              }}>
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button 
                onClick={() => setSelectedLog(null)}
                className="btn btn-primary"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogsPage;
