import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Plus, 
  Eye, 
  Trash2, 
  Check, 
  AlertCircle, 
  X, 
  Navigation,
  Clock
} from 'lucide-react';
import api from '../api/client';
import LeafletMap from '../components/common/LeafletMap';
import { useToast } from '../contexts/ToastContext';


const RoutesPage = () => {
  const { showSuccess, showError } = useToast();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [message, setMessage] = useState(null);

  // New route form state
  const [newRoute, setNewRoute] = useState({
    name: '',
    code: '',
    category: 'city',
    distanceKm: '',
    startName: '',
    startLat: 16.0433,
    startLng: 120.3342,
    endName: '',
    endLat: 16.0300,
    endLng: 120.3300,
    terminalName: '',
    terminalAddress: '',
  });

  const fetchRoutes = async () => {
    try {
      const res = await api.get('/routes');
      setRoutes(res.data.data || []);
    } catch (err) {
      console.error('Error fetching routes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleToggleStatus = async (route) => {
    try {
      await api.put(`/routes/${route._id}`, { isActive: !route.isActive });
      const statusLabel = !route.isActive ? 'Active' : 'Inactive';
      showSuccess('Route Status Updated', `Route "${route.name}" is now ${statusLabel}.`);
      setMessage({ type: 'success', text: `Route "${route.name}" status updated.` });
      fetchRoutes();
    } catch (err) {
      showError('Status Update Failed', 'Failed to update route status.');
      setMessage({ type: 'error', text: 'Failed to update route status.' });
    }
  };

  const handleCreateRoute = async (e) => {
    e.preventDefault();
    try {
      await api.post('/routes', {
        name: newRoute.name,
        code: newRoute.code.toUpperCase(),
        category: newRoute.category,
        distanceKm: Number(newRoute.distanceKm),
        startPoint: {
          name: newRoute.startName,
          lat: Number(newRoute.startLat),
          lng: Number(newRoute.startLng),
        },
        endPoint: {
          name: newRoute.endName,
          lat: Number(newRoute.endLat),
          lng: Number(newRoute.endLng),
        },
        terminalLocation: {
          name: newRoute.terminalName || newRoute.startName,
          address: newRoute.terminalAddress || 'Dagupan City',
          lat: Number(newRoute.startLat),
          lng: Number(newRoute.startLng),
        },
        waypoints: [],
      });
      showSuccess(
        'Route Registered',
        `New corridor "${newRoute.name}" (${newRoute.code.toUpperCase()}) published.`
      );
      setMessage({ type: 'success', text: 'New route added successfully!' });
      setIsAddModalOpen(false);
      fetchRoutes();
    } catch (err) {
      const errText = err.response?.data?.message || 'Failed to create route.';
      showError('Route Creation Failed', errText);
      setMessage({ type: 'error', text: errText });
    }
  };

  const filteredRoutes = routes.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) || 
                          r.code.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '26px', color: '#ffffff', marginBottom: '4px' }}>Jeepney Route Directory</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Authorized transit corridors, terminal depots, and waypoint networks in Dagupan City.
          </p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary">
          <Plus size={16} />
          <span>Register New Route</span>
        </button>
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

      {/* Interactive Leaflet Map for Jeepney Routes & Bus Terminals */}
      <LeafletMap selectedRoute={selectedRoute} onSelectRoute={setSelectedRoute} />

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>

        <input
          type="text"
          placeholder="Search by route name or code (e.g. DAG-BON)..."
          className="form-input"
          style={{ maxWidth: '380px' }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="form-select"
          style={{ maxWidth: '200px' }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="city">City Loops</option>
          <option value="intercity">Intercity Lines</option>
        </select>
      </div>

      {/* Routes Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Route Name</th>
                <th>Category</th>
                <th>Distance</th>
                <th>Transit Corridor / Loop</th>
                <th>GPX Status</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoutes.map((r) => (
                <tr key={r._id}>
                  <td>
                    <span style={{ 
                      fontFamily: 'monospace', 
                      background: 'rgba(255,255,255,0.06)', 
                      padding: '3px 8px', 
                      borderRadius: '4px',
                      color: 'var(--primary-light)',
                      fontWeight: '700'
                    }}>
                      {r.code}
                    </span>
                  </td>
                  <td style={{ fontWeight: '600', color: '#ffffff' }}>{r.name}</td>
                  <td>
                    <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
                      {r.category}
                    </span>
                  </td>
                  <td>{r.distanceKm} km</td>
                  <td style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '280px' }}>
                    {r.corridor || r.description || 'Continuous Transit Loop'}
                  </td>
                  <td>
                    {r.path && r.path.length > 0 ? (
                      <span className="badge badge-success" style={{ fontSize: '11px' }}>
                        ✓ {r.path.length} GPX Points
                      </span>
                    ) : (
                      <span className="badge badge-warning" style={{ fontSize: '11px' }}>
                        Pending Track
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggleStatus(r)}
                      style={{ background: 'transparent' }}
                    >
                      <span className={`badge ${r.isActive ? 'badge-success' : 'badge-danger'}`}>
                        ● {r.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </button>
                  </td>
                  <td>
                    <button
                      onClick={() => setSelectedRoute(r)}
                      className="btn btn-secondary btn-sm"
                    >
                      <Eye size={14} />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Route Details Modal */}
      {selectedRoute && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '620px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ color: '#ffffff', fontSize: '18px' }}>{selectedRoute.name}</h3>
                <span style={{ fontSize: '12px', color: 'var(--primary-light)', fontWeight: '600' }}>
                  Code: {selectedRoute.code} &bull; {selectedRoute.category.toUpperCase()}
                </span>
              </div>
              <button
                onClick={() => setSelectedRoute(null)}
                style={{ background: 'transparent', color: 'var(--text-dim)' }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Terminal Location</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'white', marginTop: '4px' }}>
                    {selectedRoute.terminalLocation?.name || selectedRoute.startPoint?.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>
                    {selectedRoute.terminalLocation?.address || 'Dagupan City'}
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Operating Hours</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'white', marginTop: '4px' }}>
                    {selectedRoute.operatingHours?.start || '05:00'} - {selectedRoute.operatingHours?.end || '21:00'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--accent-light)', marginTop: '2px' }}>
                    Total Length: {selectedRoute.distanceKm} KM
                  </div>
                </div>
              </div>

              <h4 style={{ fontSize: '14px', color: '#ffffff', marginBottom: '10px' }}>Transit Corridor & GPX Track</h4>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: 'var(--radius-md)', marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Loop Route Corridor</div>
                <div style={{ fontSize: '13px', color: 'white', fontWeight: '500', lineHeight: '20px' }}>
                  {selectedRoute.corridor || selectedRoute.description || 'Continuous municipal transit corridor'}
                </div>
              </div>

              {selectedRoute.path && selectedRoute.path.length > 0 ? (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  padding: '12px 14px', 
                  borderRadius: 'var(--radius-md)', 
                  background: 'rgba(16, 185, 129, 0.1)', 
                  border: '1px solid rgba(16, 185, 129, 0.25)', 
                  color: '#34d399', 
                  fontSize: '13px' 
                }}>
                  <Check size={16} />
                  <span><strong>{selectedRoute.path.length} GPS Track Points Mapped</strong> via OpenStreetMap Road Network</span>
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Awaiting GPX track mapping.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setSelectedRoute(null)}
                className="btn btn-secondary"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Route Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3 style={{ color: '#ffffff', fontSize: '18px' }}>Register New PUV Route</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'transparent', color: 'var(--text-dim)' }}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateRoute}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Route Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Downtown - Calasiao via McArthur"
                    className="form-input"
                    value={newRoute.name}
                    onChange={(e) => setNewRoute({ ...newRoute, name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Route Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. DAG-CAL"
                      className="form-input"
                      value={newRoute.code}
                      onChange={(e) => setNewRoute({ ...newRoute, code: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={newRoute.category}
                      onChange={(e) => setNewRoute({ ...newRoute, category: e.target.value })}
                    >
                      <option value="city">City Loop</option>
                      <option value="intercity">Intercity</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Distance (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="e.g. 8.5"
                    className="form-input"
                    value={newRoute.distanceKm}
                    onChange={(e) => setNewRoute({ ...newRoute, distanceKm: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Origin / Terminal</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Perez Blvd Terminal"
                      className="form-input"
                      value={newRoute.startName}
                      onChange={(e) => setNewRoute({ ...newRoute, startName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Destination</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Calasiao Town Plaza"
                      className="form-input"
                      value={newRoute.endName}
                      onChange={(e) => setNewRoute({ ...newRoute, endName: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Save Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutesPage;
