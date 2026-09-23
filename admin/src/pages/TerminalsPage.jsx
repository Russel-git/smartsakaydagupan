import React, { useState, useEffect, useRef } from 'react';
import {
  Navigation,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Clock,
  Phone,
  Search,
  CheckCircle,
  XCircle,
  X,
  Bus,
  Layers,
  Compass,
  Check,
  Eye,
  Maximize2,
  AlertCircle
} from 'lucide-react';
import api from '../api/client';
import { useToast } from '../contexts/ToastContext';
import ConfirmModal from '../components/common/ConfirmModal';

const TERMINAL_TYPES = [
  { value: 'bus', label: 'Provincial Bus', icon: '🚌', color: '#3B82F6' },
  { value: 'jeepney', label: 'Jeepney Hub', icon: '🚐', color: '#10B981' },
  { value: 'tricycle', label: 'Tricycle TODA', icon: '🛺', color: '#F59E0B' },
  { value: 'multimodal', label: 'Multimodal Hub', icon: '🏢', color: '#8B5CF6' },
];

const DAGUPAN_COORDINATE_PRESETS = [
  { label: 'Downtown Perez Blvd', lat: 16.0433, lng: 120.3342 },
  { label: 'CSI The City Mall Lucao', lat: 16.0278, lng: 120.3218 },
  { label: 'Victory Liner Perez', lat: 16.0416, lng: 120.3402 },
  { label: 'Five Star Bus Perez', lat: 16.0423, lng: 120.3421 },
  { label: 'Malimgas Public Market', lat: 16.0429, lng: 120.3361 },
  { label: 'Bonuan Gueset / Blue Beach', lat: 16.0820, lng: 120.3450 },
];

const TerminalsPage = () => {
  const { showSuccess, showError, showInfo } = useToast();
  const [terminals, setTerminals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTerminal, setEditingTerminal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('both'); // 'both', 'map', 'table'
  const [isPinpointMode, setIsPinpointMode] = useState(false);
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

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    type: 'bus',
    address: '',
    lat: '16.0433',
    lng: '120.3342',
    contactNumber: '',
    operatingHours: '24/7',
    destinations: '',
    amenities: 'Waiting Lounge, Restrooms',
    description: '',
    isActive: true,
  });

  // Overview Map References
  const overviewMapContainerRef = useRef(null);
  const overviewMapInstanceRef = useRef(null);
  const overviewMarkersRef = useRef({});

  // Modal Pinpoint Map References
  const modalMapContainerRef = useRef(null);
  const modalMapInstanceRef = useRef(null);
  const modalMarkerRef = useRef(null);

  const fetchTerminals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/terminals', {
        params: { includeInactive: 'true' },
      });
      const data = res.data?.data || [];
      setTerminals(data);
    } catch (err) {
      console.error('Failed to load terminals:', err);
      showError('Fetch Failed', 'Unable to retrieve Dagupan terminals list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerminals();
  }, []);

  // 1. Initialize & Update Main Overview Map
  useEffect(() => {
    if (!overviewMapContainerRef.current || !window.L) return;
    const L = window.L;

    if (!overviewMapInstanceRef.current) {
      const map = L.map(overviewMapContainerRef.current, {
        center: [16.0433, 120.3342],
        zoom: 13,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | SmartSakay Dagupan',
        maxZoom: 19,
      }).addTo(map);

      // Map click handler for "Quick Pinpoint New Terminal"
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        // If user clicked directly on map, open Add Modal with pinpointed coords
        setEditingTerminal(null);
        setFormData({
          name: '',
          company: '',
          type: 'bus',
          address: 'Dagupan City, Pangasinan',
          lat: lat.toFixed(6),
          lng: lng.toFixed(6),
          contactNumber: '',
          operatingHours: '24/7',
          destinations: '',
          amenities: 'Waiting Lounge, Restrooms',
          description: '',
          isActive: true,
        });
        setModalOpen(true);
      });

      overviewMapInstanceRef.current = map;
    }

    const map = overviewMapInstanceRef.current;

    // Clear existing markers
    Object.values(overviewMarkersRef.current).forEach((marker) => {
      map.removeLayer(marker);
    });
    overviewMarkersRef.current = {};

    // Render filtered terminals
    filteredTerminals.forEach((t) => {
      if (!t.lat || !t.lng) return;

      const typeObj = TERMINAL_TYPES.find((item) => item.value === t.type) || TERMINAL_TYPES[0];
      const opacity = t.isActive ? 1.0 : 0.6;
      const borderStyle = t.isActive ? '3px solid #ffffff' : '3px dashed #94a3b8';

      const customHtmlIcon = L.divIcon({
        className: 'terminal-map-pin',
        html: `
          <div style="
            background: ${typeObj.color};
            color: #ffffff;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            border: ${borderStyle};
            box-shadow: 0 4px 10px rgba(0,0,0,0.4);
            opacity: ${opacity};
            transition: transform 0.2s ease;
          ">
            ${typeObj.icon}
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const marker = L.marker([t.lat, t.lng], { icon: customHtmlIcon }).addTo(map);

      // Create rich popup with Edit and Delete actions
      const popupContent = document.createElement('div');
      popupContent.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      popupContent.style.minWidth = '220px';
      popupContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="background: ${typeObj.color}25; color: ${typeObj.color}; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 10px; border: 1px solid ${typeObj.color}50;">
            ${typeObj.icon} ${typeObj.label.toUpperCase()}
          </span>
          <span style="font-size: 10px; font-weight: 700; color: ${t.isActive ? '#10B981' : '#EF4444'};">
            ${t.isActive ? '● ACTIVE ON COMMUTER MAP' : '○ HIDDEN'}
          </span>
        </div>
        <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 2px;">
          ${t.name}
        </div>
        <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">
          ${t.company || 'Dagupan Transport Operator'}
        </div>
        <div style="font-size: 11px; color: #334155; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
          📍 <span>${t.address}</span>
        </div>
        <div style="font-family: monospace; font-size: 11px; color: #d97706; background: #fef3c7; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 8px;">
          GPS: ${t.lat.toFixed(5)}°N, ${t.lng.toFixed(5)}°E
        </div>
        <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
          🕒 ${t.operatingHours || '24/7'} ${t.contactNumber ? `• 📞 ${t.contactNumber}` : ''}
        </div>
        <div style="display: flex; gap: 6px; border-top: 1px solid #e2e8f0; padding-top: 8px;">
          <button id="popup-edit-${t._id}" style="
            flex: 1;
            background: #2563EB;
            color: #ffffff;
            border: none;
            padding: 5px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
          ">
            ✏️ Edit & Move Pin
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('popupopen', () => {
        const editBtn = document.getElementById(`popup-edit-${t._id}`);
        if (editBtn) {
          editBtn.onclick = () => {
            handleOpenEditModal(t);
          };
        }
      });

      overviewMarkersRef.current[t._id] = marker;
    });

    // Timeout to invalidateSize when tab/view changes
    setTimeout(() => {
      map.invalidateSize();
    }, 150);
  }, [terminals, search, typeFilter, viewMode]);

  // 2. Initialize & Update Modal Pinpoint Map
  useEffect(() => {
    if (!modalOpen) {
      if (modalMapInstanceRef.current) {
        modalMapInstanceRef.current.remove();
        modalMapInstanceRef.current = null;
        modalMarkerRef.current = null;
      }
      return;
    }

    const timer = setTimeout(() => {
      if (!modalMapContainerRef.current || !window.L) return;
      const L = window.L;

      const initLat = parseFloat(formData.lat) || 16.0433;
      const initLng = parseFloat(formData.lng) || 120.3342;

      if (!modalMapInstanceRef.current) {
        const map = L.map(modalMapContainerRef.current, {
          center: [initLat, initLng],
          zoom: 15,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap | SmartSakay Dagupan',
          maxZoom: 19,
        }).addTo(map);

        // Custom draggable pinpoint pin
        const pinIcon = L.divIcon({
          className: 'modal-draggable-pin',
          html: `
            <div style="
              background: #2563EB;
              color: white;
              width: 36px;
              height: 36px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
              border: 3px solid #ffffff;
              box-shadow: 0 4px 12px rgba(37, 99, 235, 0.6);
              cursor: grab;
            ">
              📍
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const marker = L.marker([initLat, initLng], {
          icon: pinIcon,
          draggable: true,
          autoPan: true,
        }).addTo(map);

        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; font-weight: 700; color: #1e293b;">
            📍 Pinpoint Position<br/>
            <span style="font-weight: 400; color: #64748b; font-size: 11px;">Drag or click map to reposition</span>
          </div>
        `).openPopup();

        // On Marker Drag
        marker.on('dragend', (e) => {
          const pos = e.target.getLatLng();
          setFormData((prev) => ({
            ...prev,
            lat: pos.lat.toFixed(6),
            lng: pos.lng.toFixed(6),
          }));
        });

        // On Map Click
        map.on('click', (e) => {
          marker.setLatLng(e.latlng);
          map.panTo(e.latlng);
          setFormData((prev) => ({
            ...prev,
            lat: e.latlng.lat.toFixed(6),
            lng: e.latlng.lng.toFixed(6),
          }));
        });

        modalMapInstanceRef.current = map;
        modalMarkerRef.current = marker;

        setTimeout(() => {
          map.invalidateSize();
        }, 200);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [modalOpen]);

  // Sync modal marker when formData lat/lng updates from presets or manual typing
  useEffect(() => {
    if (!modalMapInstanceRef.current || !modalMarkerRef.current) return;
    const latNum = parseFloat(formData.lat);
    const lngNum = parseFloat(formData.lng);
    if (!isNaN(latNum) && !isNaN(lngNum)) {
      modalMarkerRef.current.setLatLng([latNum, lngNum]);
      modalMapInstanceRef.current.panTo([latNum, lngNum]);
    }
  }, [formData.lat, formData.lng]);

  const handleOpenAddModal = () => {
    setEditingTerminal(null);
    setFormData({
      name: '',
      company: '',
      type: 'bus',
      address: '',
      lat: '16.0433',
      lng: '120.3342',
      contactNumber: '',
      operatingHours: '24/7',
      destinations: '',
      amenities: 'Waiting Lounge, Restrooms',
      description: '',
      isActive: true,
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (t) => {
    setEditingTerminal(t);
    setFormData({
      name: t.name || '',
      company: t.company || '',
      type: t.type || 'bus',
      address: t.address || '',
      lat: t.lat?.toFixed ? t.lat.toFixed(6) : (t.lat?.toString() || '16.0433'),
      lng: t.lng?.toFixed ? t.lng.toFixed(6) : (t.lng?.toString() || '120.3342'),
      contactNumber: t.contactNumber || '',
      operatingHours: t.operatingHours || '24/7',
      destinations: Array.isArray(t.destinations) ? t.destinations.join(', ') : '',
      amenities: Array.isArray(t.amenities) ? t.amenities.join(', ') : '',
      description: t.description || '',
      isActive: t.isActive !== false,
    });
    setModalOpen(true);
  };

  const handleSaveTerminal = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim()) {
      showError('Validation Error', 'Terminal name and address are required.');
      return;
    }

    const latNum = parseFloat(formData.lat);
    const lngNum = parseFloat(formData.lng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      showError('Invalid Coordinates', 'Please enter valid numeric latitude and longitude.');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      company: formData.company.trim(),
      type: formData.type,
      address: formData.address.trim(),
      lat: latNum,
      lng: lngNum,
      contactNumber: formData.contactNumber.trim(),
      operatingHours: formData.operatingHours.trim() || '24/7',
      destinations: formData.destinations
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      amenities: formData.amenities
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      description: formData.description.trim(),
      isActive: formData.isActive,
    };

    setSaving(true);
    try {
      if (editingTerminal) {
        await api.put(`/terminals/${editingTerminal._id}`, payload);
        showSuccess('Terminal Updated', `"${payload.name}" modified successfully and live on commuter map.`);
      } else {
        await api.post('/terminals', payload);
        showSuccess('Terminal Added', `"${payload.name}" created and now broadcasting to commuter dashboard.`);
      }
      setModalOpen(false);
      fetchTerminals();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save terminal.';
      showError('Save Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTerminal = (t) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Terminal',
      message: `Are you sure you want to permanently remove terminal "${t.name}"? This action cannot be undone.`,
      confirmText: 'Delete Terminal',
      cancelText: 'Cancel',
      type: 'danger',
      loading: false,
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, loading: true }));
        try {
          await api.delete(`/terminals/${t._id}`);
          showSuccess('Terminal Deleted', `"${t.name}" has been removed from Dagupan transport database.`);
          setConfirmConfig((prev) => ({ ...prev, isOpen: false, loading: false }));
          fetchTerminals();
        } catch (err) {
          showError('Delete Failed', err.response?.data?.message || 'Failed to delete terminal.');
          setConfirmConfig((prev) => ({ ...prev, loading: false }));
        }
      },
    });
  };

  const handleClearAllTerminals = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Remove All Terminals',
      message: 'Are you sure you want to remove all currently displayed terminals? You can then pinpoint and add new terminals from scratch.',
      confirmText: 'Remove All Terminals',
      cancelText: 'Cancel',
      type: 'danger',
      loading: false,
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, loading: true }));
        try {
          await api.delete('/terminals/clear-all');
          showSuccess('Terminals Removed', 'All current terminals have been removed. You can now add and pinpoint new terminals.');
          setConfirmConfig((prev) => ({ ...prev, isOpen: false, loading: false }));
          fetchTerminals();
        } catch (err) {
          showError('Clear Failed', err.response?.data?.message || 'Failed to remove terminals.');
          setConfirmConfig((prev) => ({ ...prev, loading: false }));
        }
      },
    });
  };

  const handleToggleStatus = async (t) => {
    try {
      await api.put(`/terminals/${t._id}`, { isActive: !t.isActive });
      showInfo(
        'Status Updated',
        `"${t.name}" is now ${!t.isActive ? 'Active (visible on map)' : 'Inactive (hidden from map)'}.`
      );
      fetchTerminals();
    } catch (err) {
      showError('Toggle Error', 'Failed to update terminal status.');
    }
  };

  const handlePanToTerminal = (t) => {
    if (!overviewMapInstanceRef.current || !t.lat || !t.lng) return;
    overviewMapInstanceRef.current.setView([t.lat, t.lng], 16, { animate: true });
    const marker = overviewMarkersRef.current[t._id];
    if (marker) {
      marker.openPopup();
    }
    // Scroll map into view smoothly if table only
    if (overviewMapContainerRef.current) {
      overviewMapContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const applyPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      lat: preset.lat.toFixed(6),
      lng: preset.lng.toFixed(6),
    }));
  };

  const filteredTerminals = terminals.filter((t) => {
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      t.name?.toLowerCase().includes(term) ||
      t.company?.toLowerCase().includes(term) ||
      t.address?.toLowerCase().includes(term) ||
      (t.destinations || []).some((d) => d.toLowerCase().includes(term));
    return matchesType && matchesSearch;
  });

  const busCount = terminals.filter((t) => t.type === 'bus').length;
  const jeepneyCount = terminals.filter((t) => t.type === 'jeepney').length;
  const tricycleCount = terminals.filter((t) => t.type === 'tricycle').length;
  const multimodalCount = terminals.filter((t) => t.type === 'multimodal').length;

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', color: '#ffffff', marginBottom: '4px' }}>Transport Terminals & Hubs</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Pinpoint on map, modify coordinates, and manage transit hubs dynamically displayed in the commuter app dashboard.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {terminals.length > 0 && (
            <button
              onClick={handleClearAllTerminals}
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#EF4444',
                borderColor: 'rgba(239, 68, 68, 0.35)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
              }}
              title="Remove all current terminals from database"
            >
              <Trash2 size={16} />
              <span>Clear Current Terminals</span>
            </button>
          )}
          <button onClick={handleOpenAddModal} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} />
            <span>Pinpoint New Terminal</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #3B82F6' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Provincial Bus</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', marginTop: '4px' }}>{busCount} Hubs</div>
          <div style={{ fontSize: '12px', color: '#60A5FA', marginTop: '2px' }}>Victory, Five Star, Solid North, Genesis</div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Jeepney Staging</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', marginTop: '4px' }}>{jeepneyCount} Hubs</div>
          <div style={{ fontSize: '12px', color: '#34D399', marginTop: '2px' }}>Downtown Staging & Inter-town lines</div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Tricycle TODA</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', marginTop: '4px' }}>{tricycleCount} Terminals</div>
          <div style={{ fontSize: '12px', color: '#FBBF24', marginTop: '2px' }}>City Ordinance regulated terminals</div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #8B5CF6' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Multimodal Hubs</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', marginTop: '4px' }}>{multimodalCount} Centers</div>
          <div style={{ fontSize: '12px', color: '#A78BFA', marginTop: '2px' }}>CSI Lucao & Major Transfer Hubs</div>
        </div>
      </div>

      {/* Interactive Dagupan Overview Map */}
      {(viewMode === 'both' || viewMode === 'map') && (
        <div className="card" style={{
          padding: '0',
          overflow: 'hidden',
          marginBottom: '24px',
          border: '1px solid var(--border)',
          position: 'relative',
          zIndex: 1,
          isolation: 'isolate',
        }}>
          {/* Map Controls Header */}
          <div style={{
            padding: '12px 16px',
            background: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={18} color="var(--primary)" />
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff' }}>
                Dagupan City Terminals Network Map
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                ({filteredTerminals.length} mapped terminals)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                fontSize: '11px',
                color: '#38BDF8',
                background: 'rgba(56, 189, 248, 0.1)',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <MapPin size={13} />
                <span>Tip: Click anywhere on the map to pinpoint & add a new terminal</span>
              </div>
            </div>
          </div>

          {/* Leaflet Canvas Container */}
          <div
            ref={overviewMapContainerRef}
            style={{
              width: '100%',
              height: '380px',
              background: '#0f172a',
              cursor: 'crosshair',
              position: 'relative',
              zIndex: 1,
            }}
          />

          {/* Legend Footer */}
          <div style={{
            padding: '10px 16px',
            background: 'rgba(15, 23, 42, 0.95)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            alignItems: 'center',
            fontSize: '12px',
          }}>
            <span style={{ color: 'var(--text-dim)', fontWeight: '600' }}>PIN LEGEND:</span>
            {TERMINAL_TYPES.map((t) => (
              <div key={t.value} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  background: t.color,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: '#ffffff',
                }}>
                  {t.icon}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>{t.label}</span>
              </div>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
              <span>Solid border: Active</span> • <span>Dashed border: Inactive</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '38px' }}
              placeholder="Search terminal by name, company, address, or destinations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ maxWidth: '220px' }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Terminal Types</option>
            <option value="bus">🚌 Provincial Bus</option>
            <option value="jeepney">🚐 Jeepney Hub</option>
            <option value="tricycle">🛺 Tricycle TODA</option>
            <option value="multimodal">🏢 Multimodal Hub</option>
          </select>
        </div>

        {/* View Toggle */}
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.05)',
          padding: '4px',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          gap: '4px',
        }}>
          <button
            type="button"
            onClick={() => setViewMode('both')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              background: viewMode === 'both' ? 'var(--primary)' : 'transparent',
              color: viewMode === 'both' ? '#ffffff' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            Map + Table
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              background: viewMode === 'map' ? 'var(--primary)' : 'transparent',
              color: viewMode === 'map' ? '#ffffff' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            Map Only
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              background: viewMode === 'table' ? 'var(--primary)' : 'transparent',
              color: viewMode === 'table' ? '#ffffff' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            Table Only
          </button>
        </div>
      </div>

      {/* Terminals Table */}
      {(viewMode === 'both' || viewMode === 'table') && (
        <div className="card">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
              Loading Dagupan terminals...
            </div>
          ) : filteredTerminals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
              No transport terminals found matching current criteria.
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Terminal & Operator</th>
                    <th>Type</th>
                    <th>GPS Pinpoint Coordinates</th>
                    <th>Schedule / Hours</th>
                    <th>Key Destinations</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTerminals.map((t) => {
                    const typeObj = TERMINAL_TYPES.find((item) => item.value === t.type) || TERMINAL_TYPES[0];
                    return (
                      <tr key={t._id}>
                        <td>
                          <div style={{ fontWeight: '700', color: '#ffffff', fontSize: '14px' }}>
                            {t.name}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {t.company || 'Dagupan Transit Operator'}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} color="var(--primary)" />
                            <span>{t.address}</span>
                          </div>
                        </td>

                        <td>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: `${typeObj.color}25`,
                              color: typeObj.color,
                              border: `1px solid ${typeObj.color}45`,
                              fontWeight: '600',
                            }}
                          >
                            {typeObj.icon} {typeObj.label}
                          </span>
                        </td>

                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#FBBF24', background: 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: '4px' }}>
                              {t.lat.toFixed(5)}°N, {t.lng.toFixed(5)}°E
                            </div>
                            <button
                              type="button"
                              onClick={() => handlePanToTerminal(t)}
                              title="Pan & Highlight on Map"
                              style={{
                                background: 'rgba(56, 189, 248, 0.15)',
                                color: '#38BDF8',
                                border: '1px solid rgba(56, 189, 248, 0.3)',
                                borderRadius: '4px',
                                padding: '4px 6px',
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'pointer',
                              }}
                            >
                              <Compass size={13} />
                            </button>
                          </div>
                        </td>

                        <td>
                          <div style={{ fontSize: '13px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Clock size={13} color="var(--text-dim)" />
                            <span>{t.operatingHours || '24/7'}</span>
                          </div>
                          {t.contactNumber && (
                            <div style={{ fontSize: '11px', color: '#10B981', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Phone size={11} />
                              <span>{t.contactNumber}</span>
                            </div>
                          )}
                        </td>

                        <td style={{ maxWidth: '220px' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {(t.destinations || []).slice(0, 3).map((dest, i) => (
                              <span
                                key={i}
                                style={{
                                  fontSize: '11px',
                                  background: 'rgba(255,255,255,0.06)',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  color: 'var(--text-secondary)',
                                }}
                              >
                                {dest}
                              </span>
                            ))}
                            {(t.destinations || []).length > 3 && (
                              <span style={{ fontSize: '10px', color: 'var(--text-dim)', alignSelf: 'center' }}>
                                +{t.destinations.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>

                        <td>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(t)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                            title="Click to toggle display on commuter map"
                          >
                            {t.isActive ? (
                              <span className="badge badge-success" style={{ cursor: 'pointer' }}>
                                ● On Map (Active)
                              </span>
                            ) : (
                              <span className="badge badge-danger" style={{ cursor: 'pointer' }}>
                                ○ Hidden (Inactive)
                              </span>
                            )}
                          </button>
                        </td>

                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleOpenEditModal(t)}
                              className="btn btn-secondary btn-sm"
                              title="Edit Terminal & Reposition Map Pin"
                              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Edit2 size={13} />
                              <span>Pinpoint / Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteTerminal(t)}
                              className="btn btn-sm"
                              style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                color: '#EF4444',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                              }}
                              title="Delete Terminal"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Terminal Modal with Embedded Interactive Pinpoint Map */}
      {modalOpen && (
        <div className="modal-overlay" style={{ zIndex: 99999, position: 'fixed', inset: 0 }}>
          <div className="modal-content" style={{ maxWidth: '720px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 100000 }}>
            <div className="modal-header">
              <div>
                <h3 style={{ color: '#ffffff', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={20} color="var(--primary)" />
                  <span>{editingTerminal ? `Edit & Pinpoint "${editingTerminal.name}"` : 'Pinpoint New Dagupan Transport Terminal'}</span>
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--primary-light)' }}>
                  Drag the map pin or click anywhere in Dagupan to precisely set coordinates displayed on commuter maps.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{ background: 'transparent', color: 'var(--text-dim)', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTerminal} style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
              <div className="modal-body">
                {/* 1. Embedded Interactive Pinpoint Map */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  marginBottom: '16px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Compass size={16} color="#38BDF8" />
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#38BDF8' }}>
                        Interactive Map Pinpoint
                      </span>
                    </div>
                    <div style={{
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      color: '#FBBF24',
                      background: 'rgba(0,0,0,0.4)',
                      padding: '3px 8px',
                      borderRadius: '4px',
                    }}>
                      Lat: {formData.lat} | Lng: {formData.lng}
                    </div>
                  </div>

                  {/* Leaflet Pinpoint Map Canvas */}
                  <div
                    ref={modalMapContainerRef}
                    style={{
                      width: '100%',
                      height: '240px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: '#0b0f19',
                      cursor: 'crosshair',
                      position: 'relative',
                      zIndex: 2,
                      isolation: 'isolate',
                    }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '11px', color: 'var(--text-dim)' }}>
                    <span>🎯 <strong>Click anywhere on map</strong> or <strong>drag the blue pin</strong> to set location.</span>
                    <span>Dagupan City</span>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      Snap to Dagupan Transit Landmarks:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {DAGUPAN_COORDINATE_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => applyPreset(preset)}
                          style={{
                            fontSize: '11px',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '4px',
                            color: '#93C5FD',
                            padding: '3px 8px',
                            cursor: 'pointer',
                          }}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Basic Info Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Terminal Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Victory Liner Dagupan Terminal"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Terminal Type *</label>
                    <select
                      className="form-select"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="bus">🚌 Provincial Bus</option>
                      <option value="jeepney">🚐 Jeepney Hub</option>
                      <option value="tricycle">🛺 Tricycle TODA</option>
                      <option value="multimodal">🏢 Multimodal Hub</option>
                    </select>
                  </div>
                </div>

                {/* 3. Company & Hours Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Operating Company / Association</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Victory Liner, Inc. or Perez TODA"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Operating Hours</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 24/7 or 5:00 AM - 10:00 PM"
                      value={formData.operatingHours}
                      onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                    />
                  </div>
                </div>

                {/* 4. Physical Address */}
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Physical Street Address *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Perez Blvd, Downtown Dagupan City, Pangasinan"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  />
                </div>

                {/* 5. Lat & Lng Input Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Latitude (6 decimal places)</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input"
                      placeholder="Latitude (e.g. 16.0416)"
                      value={formData.lat}
                      onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                      required
                      style={{ fontFamily: 'monospace' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Longitude (6 decimal places)</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input"
                      placeholder="Longitude (e.g. 120.3402)"
                      value={formData.lng}
                      onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                      required
                      style={{ fontFamily: 'monospace' }}
                    />
                  </div>
                </div>

                {/* 6. Destinations & Contact */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Destinations (Comma-separated)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Cubao, Pasay, Baguio, Lingayen"
                      value={formData.destinations}
                      onChange={(e) => setFormData({ ...formData, destinations: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Contact Hotline</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. (075) 522-0925"
                      value={formData.contactNumber}
                      onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    />
                  </div>
                </div>

                {/* 7. Amenities */}
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Passenger Amenities (Comma-separated)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Air-conditioned Lounge, Restrooms, Ticketing Counter, CCTV"
                    value={formData.amenities}
                    onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                  />
                </div>

                {/* 8. Description */}
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Terminal Overview & Commuter Guide</label>
                  <textarea
                    rows={2}
                    className="form-textarea"
                    placeholder="Provide commuter directions, transfer tips, or terminal services..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                {/* 9. Active Checkbox */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="isActiveCheck" style={{ fontSize: '13px', color: '#ffffff', cursor: 'pointer' }}>
                    Active & Display immediately on commuter map dashboard
                  </label>
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Check size={16} />
                  <span>{saving ? 'Saving Terminal...' : editingTerminal ? 'Save Changes' : 'Create Terminal'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

export default TerminalsPage;
