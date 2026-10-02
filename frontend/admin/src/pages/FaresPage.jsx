import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Edit3, 
  History, 
  Check, 
  AlertCircle, 
  TrendingUp, 
  X 
} from 'lucide-react';
import api from '../api/client';
import { useToast } from '../contexts/ToastContext';

const FaresPage = () => {
  const { showSuccess, showError } = useToast();
  const [fares, setFares] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingFare, setEditingFare] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Live calculator test state
  const [calcDistance, setCalcDistance] = useState(7.5);
  const [calcVehicle, setCalcVehicle] = useState('traditional');

  const fetchFares = async () => {
    try {
      const [faresRes, historyRes] = await Promise.all([
        api.get('/fares'),
        api.get('/fares/history').catch(() => ({ data: { data: [] } })),
      ]);
      setFares(faresRes.data.data || []);
      setHistory(historyRes.data.data || []);
    } catch (err) {
      console.error('Error fetching fares:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFares();
  }, []);

  const handleEditClick = (fare) => {
    setEditingFare({
      _id: fare._id,
      vehicleType: fare.vehicleType,
      baseFare: fare.baseFare,
      baseDistanceKm: fare.baseDistanceKm,
      perKmRate: fare.perKmRate,
      reason: '',
    });
  };

  const handleSaveFare = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.put(`/fares/${editingFare._id}`, {
        baseFare: Number(editingFare.baseFare),
        baseDistanceKm: Number(editingFare.baseDistanceKm),
        perKmRate: Number(editingFare.perKmRate),
        reason: editingFare.reason || 'LTFRB Fare Matrix Revision',
      });
      showSuccess(
        'Fare Matrix Updated',
        `Tariff rates for ${editingFare.vehicleType} PUVs published and synchronized.`
      );
      setMessage({ type: 'success', text: 'Fare updated successfully! Route matrices recalculated.' });
      setEditingFare(null);
      await fetchFares();
    } catch (err) {
      const errText = err.response?.data?.message || 'Failed to update fare';
      showError('Fare Update Failed', errText);
      setMessage({ type: 'error', text: errText });
    } finally {
      setSaving(false);
    }
  };

  // Preview fare computation
  const activeFare = fares.find((f) => f.vehicleType === calcVehicle) || { baseFare: 13, baseDistanceKm: 4, perKmRate: 1.8 };
  const rawSubtotal = calcDistance <= activeFare.baseDistanceKm
    ? activeFare.baseFare
    : activeFare.baseFare + (calcDistance - activeFare.baseDistanceKm) * activeFare.perKmRate;
  const regularPreview = Math.ceil(rawSubtotal);
  const discountPreview = Math.ceil(rawSubtotal * 0.8);

  return (
    <div>
      <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '26px', color: '#ffffff', marginBottom: '4px' }}>LTFRB Fare Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Maintain official tariff rates for Dagupan City and Pangasinan PUV routes.
          </p>
        </div>
      </div>

      {message && (
        <div style={{
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '14px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: message.type === 'success' ? '#34d399' : '#f87171',
          fontSize: '14px',
        }}>
          {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Active Fares Table */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '18px', color: '#ffffff', marginBottom: '16px' }}>Active LTFRB Tariff Rates</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Vehicle Type</th>
                <th>Base Fare</th>
                <th>Base Distance</th>
                <th>Per Succeeding KM</th>
                <th>Status</th>
                <th>Effective Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {fares.map((f) => (
                <tr key={f._id}>
                  <td style={{ fontWeight: '600', textTransform: 'capitalize', color: '#ffffff' }}>
                    {f.vehicleType === 'tricycle' ? 'Dagupan Tricycle' : `${f.vehicleType} Jeepney`}
                  </td>
                  <td style={{ fontWeight: '700', color: 'var(--primary-light)' }}>
                    ₱{f.baseFare.toFixed(2)}
                  </td>
                  <td>{f.baseDistanceKm} km</td>
                  <td style={{ color: 'var(--accent-light)', fontWeight: '600' }}>
                    +₱{f.perKmRate.toFixed(2)}/km
                  </td>
                  <td>
                    <span className="badge badge-success">● Active</span>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                    {new Date(f.effectiveDate || Date.now()).toLocaleDateString()}
                  </td>
                  <td>
                    <button
                      onClick={() => handleEditClick(f)}
                      className="btn btn-secondary btn-sm"
                    >
                      <Edit3 size={14} />
                      <span>Adjust Rate</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Grid: Calculator Preview & History Log */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Live Fare Calculator Preview */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <Calculator size={20} color="var(--primary-light)" />
            <h3 style={{ fontSize: '17px', color: '#ffffff' }}>Live Tariff Simulator</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
            <div>
              <label className="form-label">PUV Class</label>
              <select
                className="form-select"
                value={calcVehicle}
                onChange={(e) => setCalcVehicle(e.target.value)}
              >
                <option value="traditional">Traditional Jeepney</option>
                <option value="modern">Modern Jeepney</option>
                <option value="tricycle">Dagupan Tricycle</option>
              </select>
            </div>
            <div>
              <label className="form-label">Travel Distance (km)</label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                className="form-input"
                value={calcDistance}
                onChange={(e) => setCalcDistance(Number(e.target.value))}
              />
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
                Regular Fare
              </div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#ffffff', marginTop: '4px' }}>
                ₱{regularPreview}.00
              </div>
            </div>

            <div style={{ height: '50px', width: '1px', background: 'var(--border)' }}></div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: 'var(--accent-light)', textTransform: 'uppercase', fontWeight: '600' }}>
                20% Discounted (Student/Senior/PWD)
              </div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--accent-light)', marginTop: '4px' }}>
                ₱{discountPreview}.00
              </div>
            </div>
          </div>
        </div>

        {/* Fare History Revision Log */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <History size={20} color="var(--info)" />
            <h3 style={{ fontSize: '17px', color: '#ffffff' }}>Revision History Log</h3>
          </div>

          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
              No historical fare amendments logged yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto' }}>
              {history.map((h, i) => (
                <div
                  key={i}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border)',
                    fontSize: '13px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ffffff', fontWeight: '600' }}>
                    <span>{h.vehicleType} Jeepney</span>
                    <span style={{ color: 'var(--primary-light)' }}>₱{h.baseFare} base / ₱{h.perKmRate}/km</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {h.reason || 'Tariff adjustment'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                    {new Date(h.changedAt || h.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Fare Modal */}
      {editingFare && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ color: '#ffffff', fontSize: '18px' }}>
                Update {editingFare.vehicleType} Jeepney Rates
              </h3>
              <button
                onClick={() => setEditingFare(null)}
                style={{ background: 'transparent', color: 'var(--text-dim)' }}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveFare}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Base Fare (₱)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    className="form-input"
                    value={editingFare.baseFare}
                    onChange={(e) => setEditingFare({ ...editingFare, baseFare: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Base Distance (KM)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    className="form-input"
                    value={editingFare.baseDistanceKm}
                    onChange={(e) => setEditingFare({ ...editingFare, baseDistanceKm: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Per Succeeding KM Rate (₱)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    className="form-input"
                    value={editingFare.perKmRate}
                    onChange={(e) => setEditingFare({ ...editingFare, perKmRate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Reason / Memorandum Circular</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LTFRB Resolution 2026-03"
                    className="form-input"
                    value={editingFare.reason}
                    onChange={(e) => setEditingFare({ ...editingFare, reason: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setEditingFare(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? 'Updating...' : 'Save & Recalculate Matrices'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaresPage;
