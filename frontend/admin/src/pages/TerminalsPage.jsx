import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Clock,
  Phone,
  Search,
  X,
  Compass,
  Check,
  ArrowUpRight,
} from "lucide-react";
import api from "../api/client";
import { useToast } from "../contexts/ToastContext";
import { useTheme } from "../contexts/theme/ThemeContext";
import ConfirmModal from "../components/common/ConfirmModal";

const TERMINAL_TYPES = [
  { value: "bus", label: "Provincial Bus", icon: "🚌", color: "#3B82F6" },
  { value: "jeepney", label: "Jeepney Hub", icon: "🚐", color: "#10B981" },
  {
    value: "multimodal",
    label: "Multimodal Hub",
    icon: "🏢",
    color: "#8B5CF6",
  },
];

const STANDARD_AMENITIES = [
  "Waiting Lounge / Seating Area",
  "Restrooms / Comfort Rooms",
  "Ticketing Booth / Counter",
  "Covered Platform / Canopy",
  "CCTV & Security Guard",
  "Free Wi-Fi",
  "PWD Accessibility Ramp",
  "Baggage Storage / Cargo",
  "Food Stalls / Canteen",
  "Charging Stations",
];

const reverseGeocode = async (lat, lng) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "Accept-Language": "en",
        },
      },
    );
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const street =
          addr.road || addr.street || addr.pedestrian || addr.footway || "";
        const neighborhood =
          addr.neighbourhood ||
          addr.suburb ||
          addr.quarter ||
          addr.village ||
          addr.city_district ||
          "";
        const city = addr.city || addr.town || addr.municipality || "";
        const state = addr.state || addr.region || "";
        const parts = [street, neighborhood, city, state].filter(Boolean);
        if (parts.length > 0) return parts.join(", ");
        if (data.display_name)
          return data.display_name.split(",").slice(0, 4).join(",").trim();
      }
    }
  } catch (err) {}
  return "";
};

// Helper to format 24h time ("05:00") to 12h display string ("5:00 AM")
const formatTime12h = (time24) => {
  if (!time24) return "";
  const parts = time24.split(":");
  let hour = parseInt(parts[0], 10);
  const minute = parts[1] || "00";
  if (isNaN(hour)) return time24;
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${ampm}`;
};

// Helper to parse legacy operating hours string into state
const parseOperatingHoursToState = (str) => {
  if (!str) {
    return { is24Hours: false, start: "05:00", end: "22:00" };
  }
  const clean = str.trim().toLowerCase();
  if (
    clean.includes("24/7") ||
    clean.includes("24 hours") ||
    clean.includes("round the clock")
  ) {
    return { is24Hours: true, start: "00:00", end: "23:59" };
  }

  const match = str.match(
    /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:-|to)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
  );
  if (match) {
    const to24 = (t) => {
      let tNorm = t.trim().toLowerCase();
      let ampm = "";
      if (tNorm.includes("am")) ampm = "AM";
      if (tNorm.includes("pm")) ampm = "PM";
      tNorm = tNorm.replace(/[^\d:]/g, "");
      let [h, m] = tNorm.split(":");
      let hour = parseInt(h, 10);
      let minute = m ? parseInt(m, 10) : 0;
      if (isNaN(hour)) return "05:00";
      if (ampm === "PM" && hour < 12) hour += 12;
      if (ampm === "AM" && hour === 12) hour = 0;
      return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    };

    return {
      is24Hours: false,
      start: to24(match[1]),
      end: to24(match[2]),
    };
  }

  return { is24Hours: false, start: "05:00", end: "22:00" };
};

// Helper to parse existing amenities into checkboxes and "Others" text input
const parseAmenitiesForForm = (amenitiesInput) => {
  let list = [];
  if (Array.isArray(amenitiesInput)) {
    list = amenitiesInput
      .map((a) => (typeof a === "string" ? a.trim() : ""))
      .filter(Boolean);
  } else if (typeof amenitiesInput === "string" && amenitiesInput.trim()) {
    list = amenitiesInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const selected = [];
  const others = [];

  list.forEach((item) => {
    const matched = STANDARD_AMENITIES.find(
      (std) => std.toLowerCase() === item.toLowerCase(),
    );
    if (matched) {
      if (!selected.includes(matched)) selected.push(matched);
    } else {
      others.push(item);
    }
  });

  return {
    selectedAmenities: selected,
    isOtherAmenities: others.length > 0,
    otherAmenities: others.join(", "),
  };
};

const TerminalsPage = () => {
  const { colors } = useTheme();
  const { showSuccess, showError, showInfo } = useToast();

  const [terminals, setTerminals] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTerminal, setEditingTerminal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState("both");
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

  // Form State - coordinates start completely blank so other LGUs do not see initial preset coordinates
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    type: "bus",
    address: "",
    lat: "",
    lng: "",
    contactNumber: "",
    is24Hours: false,
    operatingHoursStart: "05:00",
    operatingHoursEnd: "22:00",
    destinations: "",
    selectedAmenities: [],
    isOtherAmenities: false,
    otherAmenities: "",
    description: "",
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
      const res = await api.get("/terminals", {
        params: { includeInactive: "true" },
      });
      const data = res.data?.data || [];
      setTerminals(data);
    } catch (err) {
      console.error("Failed to load terminals:", err);
      showError("Fetch Failed", "Unable to retrieve terminals list.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const res = await api.get("/routes");
      setRoutes(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load routes in terminals page:", err);
    }
  };

  useEffect(() => {
    fetchTerminals();
    fetchRoutes();
  }, []);

  // Connected routes helper
  const getConnectedRoutes = (t) => {
    if (!t || !routes || routes.length === 0) return [];
    const tName = (t.name || "").toLowerCase().trim();
    const tAddress = (t.address || "").toLowerCase().trim();
    const destinations = (t.destinations || []).map((d) =>
      d.toLowerCase().trim(),
    );

    return routes.filter((r) => {
      const rName = (r.name || "").toLowerCase();
      const rCorridor = (r.corridor || "").toLowerCase();
      const rTermName = (r.terminalLocation?.name || "").toLowerCase();
      const rTermAddress = (r.terminalLocation?.address || "").toLowerCase();
      const rStart = (r.startPoint?.name || "").toLowerCase();
      const rEnd = (r.endPoint?.name || "").toLowerCase();

      if (
        tName &&
        (rTermName.includes(tName) ||
          tName.includes(rTermName) ||
          rStart.includes(tName) ||
          rEnd.includes(tName))
      ) {
        return true;
      }
      if (tName && (rCorridor.includes(tName) || rName.includes(tName))) {
        return true;
      }
      if (
        tAddress &&
        rTermAddress &&
        (tAddress.includes(rTermAddress) || rTermAddress.includes(tAddress))
      ) {
        return true;
      }
      if (destinations.length > 0) {
        return destinations.some(
          (dest) =>
            dest &&
            (rName.includes(dest) ||
              rStart.includes(dest) ||
              rEnd.includes(dest)),
        );
      }
      return false;
    });
  };

  // Filtered terminals
  const filteredTerminals = terminals.filter((t) => {
    const matchesType = typeFilter === "all" || t.type === typeFilter;
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      t.name?.toLowerCase().includes(term) ||
      t.company?.toLowerCase().includes(term) ||
      t.address?.toLowerCase().includes(term) ||
      (t.destinations || []).some((d) => d.toLowerCase().includes(term));

    return matchesType && matchesSearch;
  });

  // Terminal counts
  const busCount = terminals.filter((t) => t.type === "bus").length;
  const jeepneyCount = terminals.filter((t) => t.type === "jeepney").length;
  const multimodalCount = terminals.filter(
    (t) => t.type === "multimodal",
  ).length;

  // Overview map initialization
  useEffect(() => {
    if (!overviewMapContainerRef.current || !window.L) return;
    const L = window.L;

    if (!overviewMapInstanceRef.current) {
      const map = L.map(overviewMapContainerRef.current, {
        center: [16.0433, 120.3342],
        zoom: 13,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors | SmartSakay",
        maxZoom: 19,
      }).addTo(map);

      // Click map to pinpoint and add a terminal
      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        setEditingTerminal(null);
        setFormData({
          name: "",
          company: "",
          type: "bus",
          address: "",
          lat: lat.toFixed(6),
          lng: lng.toFixed(6),
          contactNumber: "",
          is24Hours: false,
          operatingHoursStart: "05:00",
          operatingHoursEnd: "22:00",
          destinations: "",
          selectedAmenities: [],
          isOtherAmenities: false,
          otherAmenities: "",
          description: "",
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

      const typeObj =
        TERMINAL_TYPES.find((item) => item.value === t.type) ||
        TERMINAL_TYPES[0];

      const opacity = t.isActive ? 1.0 : 0.6;
      const borderStyle = t.isActive
        ? `3px solid ${colors.textPrimary}`
        : `3px dashed ${colors.disabled}`;

      const customHtmlIcon = L.divIcon({
        className: "terminal-map-pin",
        html: `
          <div style="
            background: ${typeObj.color};
            color: ${colors.textPrimary};
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

      const marker = L.marker([t.lat, t.lng], {
        icon: customHtmlIcon,
      }).addTo(map);

      // Popup
      const popupContent = document.createElement("div");
      popupContent.style.fontFamily =
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      popupContent.style.minWidth = "220px";
      popupContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="background: ${typeObj.color}25; color: ${typeObj.color}; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 10px; border: 1px solid ${typeObj.color}50;">
            ${typeObj.icon} ${typeObj.label.toUpperCase()}
          </span>
          <span style="font-size: 10px; font-weight: 700; color: ${t.isActive ? colors.success : colors.error};">
            ${t.isActive ? "● ACTIVE ON COMMUTER MAP" : "○ HIDDEN"}
          </span>
        </div>
        <div style="font-size: 14px; font-weight: 800; color: ${colors.textPrimary}; margin-bottom: 2px;">
          ${t.name}
        </div>
        <div style="font-size: 11px; color: ${colors.textSecondary}; margin-bottom: 4px;">
          ${t.company || "Transport Operator"}
        </div>
        <div style="font-size: 11px; color: ${colors.textSecondary}; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
          📍 <span>${t.address}</span>
        </div>
        <div style="font-family: monospace; font-size: 11px; color: ${colors.warning}; background: ${colors.warningLight}; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 8px;">
          GPS: ${t.lat.toFixed(5)}°N, ${t.lng.toFixed(5)}°E
        </div>
        <div style="font-size: 11px; color: ${colors.textMuted}; margin-bottom: 8px;">
          🕒 ${t.operatingHours || "24/7"} ${t.contactNumber ? `• 📞 ${t.contactNumber}` : ""}
        </div>
        <div style="display: flex; gap: 6px; border-top: 1px solid ${colors.border}; padding-top: 8px;">
          <button
            id="popup-edit-${t._id}"
            style="flex: 1; background: ${colors.info}; color: ${colors.white}; border: none; padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;"
          >
            ✏️ Edit & Move Pin
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on("popupopen", () => {
        const editBtn = document.getElementById(`popup-edit-${t._id}`);
        if (editBtn) {
          editBtn.onclick = () => {
            handleOpenEditModal(t);
          };
        }
      });

      overviewMarkersRef.current[t._id] = marker;
    });

    setTimeout(() => {
      map.invalidateSize();
    }, 150);
  }, [terminals, search, typeFilter, viewMode, colors]);

  // Modal pinpoint map initialization
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

      const hasValidCoords =
        formData.lat !== "" &&
        formData.lng !== "" &&
        !isNaN(parseFloat(formData.lat)) &&
        !isNaN(parseFloat(formData.lng));

      const parsedLat = hasValidCoords ? parseFloat(formData.lat) : null;
      const parsedLng = hasValidCoords ? parseFloat(formData.lng) : null;

      // Determine center: if valid coords exist, center on them. Otherwise, use overview center or neutral fallback
      const overviewCenter = overviewMapInstanceRef.current?.getCenter();
      const centerLat = parsedLat ?? overviewCenter?.lat ?? 16.0433;
      const centerLng = parsedLng ?? overviewCenter?.lng ?? 120.3342;
      const zoomLevel = hasValidCoords ? 15 : 13;

      if (!modalMapInstanceRef.current) {
        const map = L.map(modalMapContainerRef.current, {
          center: [centerLat, centerLng],
          zoom: zoomLevel,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors | SmartSakay",
          maxZoom: 19,
        }).addTo(map);

        const createPinIcon = () =>
          L.divIcon({
            className: "modal-draggable-pin",
            html: `
              <div style="
                background: ${colors.info};
                color: ${colors.white};
                width: 36px;
                height: 36px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                border: 3px solid ${colors.textPrimary};
                box-shadow: 0 4px 12px rgba(37, 99, 235, 0.6);
                cursor: grab;
              ">
                📍
              </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          });

        const setupMarker = (latVal, lngVal) => {
          const marker = L.marker([latVal, lngVal], {
            icon: createPinIcon(),
            draggable: true,
            autoPan: true,
          }).addTo(map);

          marker
            .bindPopup(
              `
                <div style="font-family: sans-serif; font-size: 12px; font-weight: 700; color: ${colors.textPrimary};">
                  📍 Pinpoint Position<br/>
                  <span style="font-weight: 400; color: ${colors.textMuted}; font-size: 11px;">
                    Drag or click map to reposition
                  </span>
                </div>
              `,
            )
            .openPopup();

          marker.on("dragend", (e) => {
            const pos = e.target.getLatLng();
            setFormData((prev) => ({
              ...prev,
              lat: pos.lat.toFixed(6),
              lng: pos.lng.toFixed(6),
            }));
          });

          return marker;
        };

        // Only create marker if coordinate data actually exists!
        if (hasValidCoords) {
          modalMarkerRef.current = setupMarker(parsedLat, parsedLng);
        }

        map.on("click", (e) => {
          const clickedLat = e.latlng.lat.toFixed(6);
          const clickedLng = e.latlng.lng.toFixed(6);

          if (!modalMarkerRef.current) {
            modalMarkerRef.current = setupMarker(e.latlng.lat, e.latlng.lng);
          } else {
            modalMarkerRef.current.setLatLng(e.latlng);
          }

          map.panTo(e.latlng);

          setFormData((prev) => ({
            ...prev,
            lat: clickedLat,
            lng: clickedLng,
          }));
        });

        modalMapInstanceRef.current = map;

        setTimeout(() => {
          map.invalidateSize();
        }, 200);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [modalOpen, colors]);

  // Sync modal marker with coordinate changes
  useEffect(() => {
    if (!modalMapInstanceRef.current) return;

    const latNum = parseFloat(formData.lat);
    const lngNum = parseFloat(formData.lng);

    if (
      !isNaN(latNum) &&
      !isNaN(lngNum) &&
      formData.lat !== "" &&
      formData.lng !== ""
    ) {
      if (modalMarkerRef.current) {
        modalMarkerRef.current.setLatLng([latNum, lngNum]);
      } else if (window.L) {
        const L = window.L;
        const pinIcon = L.divIcon({
          className: "modal-draggable-pin",
          html: `
            <div style="
              background: ${colors.info};
              color: ${colors.white};
              width: 36px;
              height: 36px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
              border: 3px solid ${colors.textPrimary};
              box-shadow: 0 4px 12px rgba(37, 99, 235, 0.6);
              cursor: grab;
            ">
              📍
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const marker = L.marker([latNum, lngNum], {
          icon: pinIcon,
          draggable: true,
          autoPan: true,
        }).addTo(modalMapInstanceRef.current);

        marker.on("dragend", (e) => {
          const pos = e.target.getLatLng();
          setFormData((prev) => ({
            ...prev,
            lat: pos.lat.toFixed(6),
            lng: pos.lng.toFixed(6),
          }));
        });

        modalMarkerRef.current = marker;
      }
      modalMapInstanceRef.current.panTo([latNum, lngNum]);
    } else {
      if (modalMarkerRef.current) {
        modalMapInstanceRef.current.removeLayer(modalMarkerRef.current);
        modalMarkerRef.current = null;
      }
    }
  }, [formData.lat, formData.lng, colors]);

  // Open Add Modal with completely blank coordinates and blank form
  const handleOpenAddModal = () => {
    setEditingTerminal(null);
    setFormData({
      name: "",
      company: "",
      type: "bus",
      address: "",
      lat: "",
      lng: "",
      contactNumber: "",
      is24Hours: false,
      operatingHoursStart: "05:00",
      operatingHoursEnd: "22:00",
      destinations: "",
      selectedAmenities: [],
      isOtherAmenities: false,
      otherAmenities: "",
      description: "",
      isActive: true,
    });
    setModalOpen(true);
  };

  // Open Edit Modal with existing terminal data
  const handleOpenEditModal = (t) => {
    setEditingTerminal(t);

    const hoursState = parseOperatingHoursToState(t.operatingHours);
    const amenitiesState = parseAmenitiesForForm(t.amenities);

    setFormData({
      name: t.name || "",
      company: t.company || "",
      type: t.type || "bus",
      address: t.address || "",
      lat: t.lat !== undefined && t.lat !== null ? t.lat.toString() : "",
      lng: t.lng !== undefined && t.lng !== null ? t.lng.toString() : "",
      contactNumber: t.contactNumber || "",
      is24Hours: hoursState.is24Hours,
      operatingHoursStart: hoursState.start,
      operatingHoursEnd: hoursState.end,
      destinations: Array.isArray(t.destinations)
        ? t.destinations.join(", ")
        : t.destinations || "",
      selectedAmenities: amenitiesState.selectedAmenities,
      isOtherAmenities: amenitiesState.isOtherAmenities,
      otherAmenities: amenitiesState.otherAmenities,
      description: t.description || "",
      isActive: t.isActive !== false,
    });

    setModalOpen(true);
  };

  // Save terminal
  const handleSaveTerminal = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showError("Validation Error", "Terminal name is required.");
      return;
    }

    if (!formData.lat || !formData.lng) {
      showError(
        "Missing Pinpoint Coordinates",
        "Please click on the map to pinpoint this terminal's GPS coordinates.",
      );
      return;
    }

    const validatePHPhoneNumber = (phone) => {
      const cleaned = phone.trim().replace(/[\s-]/g, "");
      const regex = /^(?:\+639\d{9}|639\d{9}|09\d{9})$/;
      return regex.test(cleaned);
    };

    if (!validatePHPhoneNumber(formData.contactNumber)) {
      showError(
        "Incorrect number format.",
        "Please enter a valid Philippine number format",
      );
      return;
    }

    const latNum = parseFloat(formData.lat);
    const lngNum = parseFloat(formData.lng);

    if (isNaN(latNum) || isNaN(lngNum)) {
      showError(
        "Invalid Coordinates",
        "Please provide valid numeric latitude and longitude coordinates.",
      );
      return;
    }

    // Determine operating hours string
    let operatingHoursStr = "24/7";
    if (formData.is24Hours) {
      operatingHoursStr = "24/7";
    } else if (formData.operatingHoursStart && formData.operatingHoursEnd) {
      operatingHoursStr = `${formatTime12h(formData.operatingHoursStart)} - ${formatTime12h(formData.operatingHoursEnd)}`;
    } else if (formData.operatingHoursStart) {
      operatingHoursStr = `Opens at ${formatTime12h(formData.operatingHoursStart)}`;
    }

    // Combine selected checkboxes and custom "Others" amenities
    let finalAmenities = [...formData.selectedAmenities];
    if (formData.isOtherAmenities && formData.otherAmenities.trim()) {
      const extra = formData.otherAmenities
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      finalAmenities = [...finalAmenities, ...extra];
    }
    finalAmenities = Array.from(new Set(finalAmenities));

    setSaving(true);

    let resolvedAddress = (formData.address || "").trim();
    if (
      !resolvedAddress ||
      (editingTerminal &&
        (editingTerminal.lat !== latNum || editingTerminal.lng !== lngNum))
    ) {
      const geocoded = await reverseGeocode(latNum, lngNum);
      if (geocoded) {
        resolvedAddress = geocoded;
      } else if (!resolvedAddress) {
        resolvedAddress = `${formData.name.trim()} Terminal (${latNum.toFixed(4)}, ${lngNum.toFixed(4)})`;
      }
    }

    const payload = {
      name: formData.name.trim(),
      company: formData.company.trim(),
      type: formData.type,
      address: resolvedAddress,
      lat: latNum,
      lng: lngNum,
      contactNumber: formData.contactNumber.trim(),
      operatingHours: operatingHoursStr,
      destinations: formData.destinations
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      amenities: finalAmenities,
      description: formData.description.trim(),
      isActive: formData.isActive,
    };

    try {
      if (editingTerminal) {
        await api.put(`/terminals/${editingTerminal._id}`, payload);
        showSuccess(
          "Terminal Updated",
          `"${payload.name}" modified successfully and live on commuter map.`,
        );
      } else {
        await api.post("/terminals", payload);
        showSuccess(
          "Terminal Added",
          `"${payload.name}" created and now broadcasting to commuter dashboard.`,
        );
      }

      setModalOpen(false);
      fetchTerminals();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save terminal.";
      showError("Save Error", msg);
    } finally {
      setSaving(false);
    }
  };

  // Delete terminal
  const handleDeleteTerminal = (t) => {
    setConfirmConfig({
      isOpen: true,
      title: "Delete Terminal",
      message: `Are you sure you want to permanently remove terminal "${t.name}"? This action cannot be undone.`,
      confirmText: "Delete Terminal",
      cancelText: "Cancel",
      type: "danger",
      loading: false,
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, loading: true }));
        try {
          await api.delete(`/terminals/${t._id}`);
          showSuccess(
            "Terminal Deleted",
            `"${t.name}" has been removed from transport database.`,
          );
          setConfirmConfig((prev) => ({
            ...prev,
            isOpen: false,
            loading: false,
          }));
          fetchTerminals();
        } catch (err) {
          showError(
            "Delete Failed",
            err.response?.data?.message || "Failed to delete terminal.",
          );
          setConfirmConfig((prev) => ({ ...prev, loading: false }));
        }
      },
    });
  };

  // Clear all terminals
  const handleClearAllTerminals = () => {
    setConfirmConfig({
      isOpen: true,
      title: "Remove All Terminals",
      message:
        "Are you sure you want to remove all currently displayed terminals? You can then pinpoint and add new terminals from scratch.",
      confirmText: "Remove All Terminals",
      cancelText: "Cancel",
      type: "danger",
      loading: false,
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, loading: true }));
        try {
          await api.delete("/terminals/clear-all");
          showSuccess(
            "Terminals Removed",
            "All current terminals have been removed. You can now add and pinpoint new terminals.",
          );
          setConfirmConfig((prev) => ({
            ...prev,
            isOpen: false,
            loading: false,
          }));
          fetchTerminals();
        } catch (err) {
          showError(
            "Clear Failed",
            err.response?.data?.message || "Failed to remove terminals.",
          );
          setConfirmConfig((prev) => ({ ...prev, loading: false }));
        }
      },
    });
  };

  // Toggle active status
  const handleToggleStatus = async (t) => {
    try {
      await api.put(`/terminals/${t._id}`, {
        isActive: !t.isActive,
      });
      showInfo(
        "Status Updated",
        `"${t.name}" is now ${
          !t.isActive ? "Active (visible on map)" : "Inactive (hidden from map)"
        }.`,
      );
      fetchTerminals();
    } catch (err) {
      showError("Toggle Error", "Failed to update terminal status.");
    }
  };

  // Pan overview map to terminal
  const handlePanToTerminal = (t) => {
    if (!overviewMapInstanceRef.current || !t.lat || !t.lng) return;
    overviewMapInstanceRef.current.setView([t.lat, t.lng], 16, {
      animate: true,
    });
    const marker = overviewMarkersRef.current[t._id];
    if (marker) marker.openPopup();
    if (overviewMapContainerRef.current) {
      overviewMapContainerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  return (
    <div>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
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
            }}
          >
            Transport Terminals & Hubs
          </h1>
          <p
            style={{
              color: colors.textMuted,
              fontSize: "14px",
            }}
          >
            Pinpoint on map, configure coordinates, and manage transit hubs
            dynamically displayed in the commuter app dashboard.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          {terminals.length > 0 && (
            <button
              onClick={handleClearAllTerminals}
              className="btn btn-secondary"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: colors.error,
                borderColor: colors.error,
                backgroundColor: colors.errorLight,
              }}
              title="Remove all current terminals from database"
            >
              <Trash2 size={16} />
              <span>Clear Current Terminals</span>
            </button>
          )}

          <button
            onClick={handleOpenAddModal}
            className="btn"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: colors.primary,
              color: colors.white,
              boxShadow: `0 4px 12px ${colors.primary}50`,
            }}
          >
            <Plus size={18} />
            <span>Pinpoint New Terminal</span>
          </button>
        </div>
      </div>

      {/* STATS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {/* Bus */}
        <div
          className="card"
          style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            padding: "16px 20px",
            borderLeft: `4px solid ${colors.info}`,
          }}
        >
          <div
            style={{
              fontSize: "12px",
              color: colors.textMuted,
              textTransform: "uppercase",
              fontWeight: "600",
            }}
          >
            Provincial Bus
          </div>
          <div
            style={{
              fontSize: "24px",
              fontWeight: "800",
              color: colors.textPrimary,
              marginTop: "4px",
            }}
          >
            {busCount} Hubs
          </div>
          <div
            style={{
              fontSize: "12px",
              color: colors.info,
              marginTop: "2px",
            }}
          >
            Victory, Five Star, Solid North, Genesis
          </div>
        </div>

        {/* Jeepney */}
        <div
          className="card"
          style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            padding: "16px 20px",
            borderLeft: `4px solid ${colors.success}`,
          }}
        >
          <div
            style={{
              fontSize: "12px",
              color: colors.textMuted,
              textTransform: "uppercase",
              fontWeight: "600",
            }}
          >
            Jeepney Staging
          </div>
          <div
            style={{
              fontSize: "24px",
              fontWeight: "800",
              color: colors.textPrimary,
              marginTop: "4px",
            }}
          >
            {jeepneyCount} Hubs
          </div>
          <div
            style={{
              fontSize: "12px",
              color: colors.success,
              marginTop: "2px",
            }}
          >
            City Staging & Inter-town lines
          </div>
        </div>

        {/* Multimodal */}
        <div
          className="card"
          style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            padding: "16px 20px",
            borderLeft: `4px solid ${colors.primary}`,
          }}
        >
          <div
            style={{
              fontSize: "12px",
              color: colors.textMuted,
              textTransform: "uppercase",
              fontWeight: "600",
            }}
          >
            Multimodal Hubs
          </div>
          <div
            style={{
              fontSize: "24px",
              fontWeight: "800",
              color: colors.textPrimary,
              marginTop: "4px",
            }}
          >
            {multimodalCount} Centers
          </div>
          <div
            style={{
              fontSize: "12px",
              color: colors.primaryLight,
              marginTop: "2px",
            }}
          >
            Commercial Centers & Major Transfer Hubs
          </div>
        </div>
      </div>

      {/* OVERVIEW MAP */}
      <div
        className="card"
        style={{
          padding: "0",
          overflow: "hidden",
          marginBottom: "24px",
          border: `1px solid ${colors.border}`,
          position: "relative",
          zIndex: 1,
          isolation: "isolate",
        }}
      >
        {(viewMode === "both" || viewMode === "map") && (
          <>
            <div
              style={{
                padding: "12px 16px",
                background: colors.surfaceElevated,
                borderBottom: `1px solid ${colors.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Compass size={18} color={colors.primary} />
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "700",
                    color: colors.textPrimary,
                  }}
                >
                  Transit Terminals Network Map
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: colors.textMuted,
                  }}
                >
                  ({filteredTerminals.length} mapped terminals)
                </span>
              </div>

              <div
                style={{
                  fontSize: "11px",
                  color: colors.info,
                  background: colors.infoLight,
                  padding: "4px 10px",
                  borderRadius: "6px",
                  border: `1px solid ${colors.info}`,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <MapPin size={13} />
                <span>
                  Tip: Click anywhere on the map to pinpoint & add a new
                  terminal
                </span>
              </div>
            </div>

            <div
              ref={overviewMapContainerRef}
              style={{
                width: "100%",
                height: "380px",
                background: colors.background,
                cursor: "crosshair",
                position: "relative",
                zIndex: 1,
              }}
            />

            <div
              style={{
                padding: "10px 16px",
                background: colors.surfaceElevated,
                borderTop: `1px solid ${colors.border}`,
                display: "flex",
                flexWrap: "wrap",
                gap: "16px",
                alignItems: "center",
                fontSize: "12px",
              }}
            >
              <span style={{ color: colors.textMuted, fontWeight: "600" }}>
                PIN LEGEND:
              </span>
              {TERMINAL_TYPES.map((t) => (
                <div
                  key={t.value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span
                    style={{
                      background: t.color,
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      color: colors.textPrimary,
                    }}
                  >
                    {t.icon}
                  </span>
                  <span style={{ color: colors.textSecondary }}>{t.label}</span>
                </div>
              ))}

              <div
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: colors.textMuted,
                }}
              >
                <span>Solid border: Active</span>•
                <span>Dashed border: Inactive</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* FILTER / SEARCH */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "20px",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "12px",
            flex: 1,
            minWidth: "300px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              position: "relative",
              flex: 1,
              minWidth: "240px",
            }}
          >
            <Search
              size={18}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: colors.textMuted,
              }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: "38px" }}
              placeholder="Search terminal by name, company, address, or destinations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ maxWidth: "220px" }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Terminal Types</option>
            <option value="bus">🚌 Provincial Bus</option>
            <option value="jeepney">🚐 Jeepney Hub</option>
            <option value="multimodal">🏢 Multimodal Hub</option>
          </select>
        </div>

        {/* View Toggle */}
        <div
          style={{
            display: "flex",
            background: colors.surfaceElevated,
            padding: "4px",
            borderRadius: "8px",
            border: `1px solid ${colors.border}`,
            gap: "4px",
          }}
        >
          {[
            ["both", "Map + Table"],
            ["map", "Map Only"],
            ["table", "Table Only"],
          ].map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "600",
                background: viewMode === mode ? colors.primary : "transparent",
                color: viewMode === mode ? colors.white : colors.textMuted,
                cursor: "pointer",
                border: "none",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE */}
      {(viewMode === "both" || viewMode === "table") && (
        <div
          className="card"
          style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
          }}
        >
          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: "50px 0",
                color: colors.textMuted,
              }}
            >
              Loading terminals...
            </div>
          ) : filteredTerminals.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "50px 0",
                color: colors.textMuted,
              }}
            >
              No transport terminals found matching current criteria.
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Terminal & Operator</th>
                    <th>Type</th>
                    <th>Connected Routes (Click to View Route)</th>
                    <th>GPS Pinpoint Coordinates</th>
                    <th>Schedule / Hours</th>
                    <th>Key Destinations</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTerminals.map((t) => {
                    const typeObj =
                      TERMINAL_TYPES.find((item) => item.value === t.type) ||
                      TERMINAL_TYPES[0];

                    return (
                      <tr key={t._id}>
                        <td>
                          <div
                            style={{
                              fontWeight: "700",
                              color: colors.textPrimary,
                              fontSize: "14px",
                            }}
                          >
                            {t.name}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: colors.textMuted,
                              marginTop: "2px",
                            }}
                          >
                            {t.company || "Transit Operator"}
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: colors.textMuted,
                              marginTop: "2px",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <MapPin size={12} color={colors.primary} />
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
                              fontWeight: "600",
                            }}
                          >
                            {typeObj.icon} {typeObj.label}
                          </span>
                        </td>

                        {/* Connected Routes */}
                        <td>
                          {(() => {
                            const connected = getConnectedRoutes(t);
                            if (connected.length === 0) {
                              return (
                                <span
                                  style={{
                                    fontSize: "12px",
                                    color: colors.textMuted,
                                    fontStyle: "italic",
                                  }}
                                >
                                  No linked routes
                                </span>
                              );
                            }
                            return (
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "6px",
                                  minWidth: "160px",
                                  maxWidth: "260px",
                                }}
                              >
                                {connected.map((r) => (
                                  <Link
                                    key={r._id}
                                    to={`/routes?routeId=${r._id}`}
                                    title={`Click to open and view route: ${r.name} (${r.code})`}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      gap: "8px",
                                      padding: "6px 12px",
                                      borderRadius: "8px",
                                      backgroundColor: "#2563EB",
                                      color: "#FFFFFF",
                                      border: "1.5px solid #1D4ED8",
                                      boxShadow:
                                        "0 2px 6px rgba(37,99,235,0.3)",
                                      fontSize: "12px",
                                      fontWeight: "700",
                                      textDecoration: "none",
                                      cursor: "pointer",
                                      transition: "all 0.15s ease",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        overflow: "hidden",
                                      }}
                                    >
                                      <Compass
                                        size={13}
                                        style={{ flexShrink: 0 }}
                                      />
                                      <span
                                        style={{
                                          fontFamily: "monospace",
                                          letterSpacing: "0.5px",
                                        }}
                                      >
                                        {r.code}
                                      </span>
                                      <span
                                        style={{
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        • {r.name}
                                      </span>
                                    </div>
                                    <ArrowUpRight
                                      size={13}
                                      style={{ flexShrink: 0 }}
                                    />
                                  </Link>
                                ))}
                              </div>
                            );
                          })()}
                        </td>

                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <div
                              style={{
                                fontFamily: "monospace",
                                fontSize: "12px",
                                color: colors.warning,
                                background: colors.surfaceElevated,
                                padding: "4px 8px",
                                borderRadius: "4px",
                              }}
                            >
                              {t.lat.toFixed(5)}°N, {t.lng.toFixed(5)}°E
                            </div>
                            <button
                              type="button"
                              onClick={() => handlePanToTerminal(t)}
                              title="Pan & Highlight on Map"
                              style={{
                                background: colors.infoLight,
                                color: colors.info,
                                border: `1px solid ${colors.info}`,
                                borderRadius: "4px",
                                padding: "4px 6px",
                                display: "flex",
                                alignItems: "center",
                                cursor: "pointer",
                              }}
                            >
                              <Compass size={13} />
                            </button>
                          </div>
                        </td>

                        <td>
                          <div
                            style={{
                              fontSize: "13px",
                              color: colors.textPrimary,
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                            }}
                          >
                            <Clock size={13} color={colors.textMuted} />
                            <span>{t.operatingHours || "24/7"}</span>
                          </div>

                          {t.contactNumber && (
                            <div
                              style={{
                                fontSize: "11px",
                                color: colors.success,
                                marginTop: "2px",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <Phone size={11} />
                              <span>{t.contactNumber}</span>
                            </div>
                          )}
                        </td>

                        <td style={{ maxWidth: "220px" }}>
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "4px",
                            }}
                          >
                            {(t.destinations || [])
                              .slice(0, 3)
                              .map((dest, i) => (
                                <span
                                  key={i}
                                  style={{
                                    fontSize: "11px",
                                    background: colors.surfaceElevated,
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    color: colors.textSecondary,
                                  }}
                                >
                                  {dest}
                                </span>
                              ))}

                            {(t.destinations || []).length > 3 && (
                              <span
                                style={{
                                  fontSize: "10px",
                                  color: colors.textMuted,
                                  alignSelf: "center",
                                }}
                              >
                                +{t.destinations.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>

                        <td>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(t)}
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                            }}
                            title="Click to toggle display on commuter map"
                          >
                            {t.isActive ? (
                              <span
                                className="badge badge-success"
                                style={{ cursor: "pointer" }}
                              >
                                ● On Map (Active)
                              </span>
                            ) : (
                              <span
                                className="badge badge-danger"
                                style={{ cursor: "pointer" }}
                              >
                                ○ Hidden (Inactive)
                              </span>
                            )}
                          </button>
                        </td>

                        <td>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              onClick={() => handleOpenEditModal(t)}
                              className="btn btn-secondary btn-sm"
                              title="Edit Terminal & Reposition Map Pin"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <Edit2 size={13} />
                              <span>Pinpoint / Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteTerminal(t)}
                              className="btn btn-sm"
                              style={{
                                backgroundColor: "#FEE2E2",
                                color: "#DC2626",
                                border: "1px solid #FECACA",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "6px 12px",
                                fontSize: "12px",
                                fontWeight: "600",
                                borderRadius: "8px",
                                cursor: "pointer",
                              }}
                              title="Delete Terminal"
                            >
                              <Trash2 size={14} />
                              <span>Delete</span>
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

      {/* ADD / EDIT MODAL */}
      {modalOpen && (
        <div
          className="modal-overlay"
          style={{
            zIndex: 99999,
            position: "fixed",
            inset: 0,
          }}
        >
          <div
            className="modal-content"
            style={{
              maxWidth: "760px",
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              position: "relative",
              zIndex: 100000,
            }}
          >
            <div className="modal-header">
              <div>
                <h3
                  style={{
                    color: colors.textPrimary,
                    fontSize: "18px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <MapPin size={20} color={colors.primary} />
                  <span>
                    {editingTerminal
                      ? `Edit & Pinpoint "${editingTerminal.name}"`
                      : "Pinpoint New Transport Terminal"}
                  </span>
                </h3>
                <span
                  style={{
                    fontSize: "12px",
                    color: colors.warning,
                  }}
                >
                  Click anywhere on the map to place the pinpoint pin, or enter
                  coordinates directly below.
                </span>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{
                  background: "transparent",
                  color: colors.textMuted,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSaveTerminal}
              style={{
                overflowY: "auto",
                flex: 1,
                paddingRight: "4px",
              }}
            >
              <div className="modal-body">
                {/* Interactive Map Pinpoint Section */}
                <div
                  style={{
                    background: colors.surfaceElevated,
                    border: `1px solid ${colors.info}`,
                    borderRadius: "var(--radius-md)",
                    padding: "12px",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                      flexWrap: "wrap",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Compass size={16} color={colors.info} />
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: "700",
                          color: colors.info,
                        }}
                      >
                        Interactive Map Pinpoint
                      </span>
                    </div>

                    <div
                      style={{
                        fontFamily: "monospace",
                        fontSize: "11px",
                        color:
                          formData.lat && formData.lng
                            ? colors.warning
                            : colors.textMuted,
                        background: colors.background,
                        padding: "4px 8px",
                        borderRadius: "4px",
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      {formData.lat && formData.lng
                        ? `Lat: ${formData.lat} | Lng: ${formData.lng}`
                        : "Coordinates: [ Not Selected — Click Map ]"}
                    </div>
                  </div>

                  <div
                    ref={modalMapContainerRef}
                    style={{
                      width: "100%",
                      height: "230px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      border: `1px solid ${colors.border}`,
                      background: colors.background,
                      cursor: "crosshair",
                      position: "relative",
                      zIndex: 2,
                      isolation: "isolate",
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: "6px",
                      fontSize: "11px",
                      color: colors.textMuted,
                    }}
                  >
                    <span>
                      🎯 <strong>Click anywhere on map</strong> or{" "}
                      <strong>drag pin</strong> to set location.
                    </span>
                    <span
                      style={{
                        fontWeight: "600",
                        color:
                          formData.lat && formData.lng
                            ? colors.success
                            : colors.warning,
                      }}
                    >
                      {formData.lat && formData.lng
                        ? "✓ Coordinates captured"
                        : "⚠ Pinpoint pending"}
                    </span>
                  </div>

                  {/* Manual Coordinate Inputs - blank by default for LGUs */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                      marginTop: "10px",
                      paddingTop: "8px",
                      borderTop: `1px solid ${colors.border}`,
                    }}
                  >
                    <div>
                      <label
                        style={{
                          fontSize: "11px",
                          fontWeight: "600",
                          color: colors.textSecondary,
                          marginBottom: "3px",
                          display: "block",
                        }}
                      >
                        Latitude Coordinate *
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Click map or type latitude"
                        value={formData.lat}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            lat: e.target.value,
                          })
                        }
                        style={{
                          fontSize: "12px",
                          fontFamily: "monospace",
                          padding: "6px 10px",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: "11px",
                          fontWeight: "600",
                          color: colors.textSecondary,
                          marginBottom: "3px",
                          display: "block",
                        }}
                      >
                        Longitude Coordinate *
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Click map or type longitude"
                        value={formData.lng}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            lng: e.target.value,
                          })
                        }
                        style={{
                          fontSize: "12px",
                          fontFamily: "monospace",
                          padding: "6px 10px",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Basic Info */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr",
                    gap: "14px",
                    marginBottom: "14px",
                  }}
                >
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Terminal Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Central Integrated Transit Terminal"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          name: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Terminal Type *</label>
                    <select
                      className="form-select"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value,
                        })
                      }
                    >
                      <option value="bus">🚌 Provincial Bus</option>
                      <option value="jeepney">🚐 Jeepney Hub</option>
                      <option value="multimodal">🏢 Multimodal Hub</option>
                    </select>
                  </div>
                </div>

                {/* Company & Operating Hours Range */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "14px",
                    marginBottom: "14px",
                  }}
                >
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">
                      Operating Company / Association
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Bus Lines Inc. / Drivers Transport Coop"
                      value={formData.company}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          company: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* Range of Hours Selector */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "4px",
                      }}
                    >
                      <label className="form-label" style={{ marginBottom: 0 }}>
                        Operating Hours
                      </label>
                      <label
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "12px",
                          color: colors.primary,
                          cursor: "pointer",
                          fontWeight: "600",
                          userSelect: "none",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.is24Hours}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              is24Hours: e.target.checked,
                            })
                          }
                          style={{
                            width: "15px",
                            height: "15px",
                            cursor: "pointer",
                          }}
                        />
                        <span>Open 24/7</span>
                      </label>
                    </div>

                    {formData.is24Hours ? (
                      <div
                        style={{
                          padding: "8px 12px",
                          borderRadius: "6px",
                          backgroundColor: colors.surfaceElevated,
                          border: `1px solid ${colors.border}`,
                          fontSize: "12px",
                          color: colors.info,
                          fontWeight: "600",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <Clock size={14} />
                        <span>24 Hours Daily (Continuous Operations)</span>
                      </div>
                    ) : (
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <input
                              type="time"
                              className="form-input"
                              value={formData.operatingHoursStart}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  operatingHoursStart: e.target.value,
                                })
                              }
                              style={{ padding: "6px 8px", fontSize: "12px" }}
                              title="Opening Time"
                            />
                          </div>
                          <span
                            style={{
                              fontSize: "12px",
                              color: colors.textMuted,
                              fontWeight: "600",
                            }}
                          >
                            to
                          </span>
                          <div style={{ flex: 1 }}>
                            <input
                              type="time"
                              className="form-input"
                              value={formData.operatingHoursEnd}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  operatingHoursEnd: e.target.value,
                                })
                              }
                              style={{ padding: "6px 8px", fontSize: "12px" }}
                              title="Closing Time"
                            />
                          </div>
                        </div>
                        {formData.operatingHoursStart &&
                          formData.operatingHoursEnd && (
                            <div
                              style={{
                                fontSize: "11px",
                                color: colors.textMuted,
                                marginTop: "4px",
                              }}
                            >
                              Schedule:{" "}
                              <strong>
                                {formatTime12h(formData.operatingHoursStart)} –{" "}
                                {formatTime12h(formData.operatingHoursEnd)}
                              </strong>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Destinations & Contact */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr",
                    gap: "14px",
                    marginBottom: "14px",
                  }}
                >
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">
                      Destinations (Comma-separated)
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Manila, Baguio, Clark, Lingayen"
                      value={formData.destinations}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          destinations: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Contact Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. +63 9123456789"
                      value={formData.contactNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactNumber: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Passenger Amenities: Checkboxes + Others with comma-separated text input */}
                <div className="form-group" style={{ marginBottom: "14px" }}>
                  <label className="form-label" style={{ marginBottom: "6px" }}>
                    Passenger Amenities
                  </label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(210px, 1fr))",
                      gap: "8px",
                      backgroundColor: colors.surfaceElevated,
                      padding: "12px",
                      borderRadius: "8px",
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    {STANDARD_AMENITIES.map((amenity) => {
                      const isChecked =
                        formData.selectedAmenities.includes(amenity);
                      return (
                        <label
                          key={amenity}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "12px",
                            color: colors.textPrimary,
                            cursor: "pointer",
                            userSelect: "none",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFormData((prev) => ({
                                ...prev,
                                selectedAmenities: checked
                                  ? [...prev.selectedAmenities, amenity]
                                  : prev.selectedAmenities.filter(
                                      (a) => a !== amenity,
                                    ),
                              }));
                            }}
                            style={{
                              width: "16px",
                              height: "16px",
                              cursor: "pointer",
                            }}
                          />
                          <span>{amenity}</span>
                        </label>
                      );
                    })}

                    {/* Others Checkbox */}
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "12px",
                        fontWeight: "700",
                        color: colors.primary,
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.isOtherAmenities}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            isOtherAmenities: e.target.checked,
                          }));
                        }}
                        style={{
                          width: "16px",
                          height: "16px",
                          cursor: "pointer",
                        }}
                      />
                      <span>Others</span>
                    </label>
                  </div>

                  {formData.isOtherAmenities && (
                    <div style={{ marginTop: "10px" }}>
                      <label
                        style={{
                          fontSize: "11px",
                          color: colors.textSecondary,
                          marginBottom: "4px",
                          display: "block",
                          fontWeight: "600",
                        }}
                      >
                        Other Amenities (Comma-separated):
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Express Baggage Counter, Food Stalls, Mobile Charging Station"
                        value={formData.otherAmenities}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            otherAmenities: e.target.value,
                          })
                        }
                        autoFocus
                      />
                    </div>
                  )}
                </div>

                {/* Active Toggle */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isActive: e.target.checked,
                      })
                    }
                    style={{
                      width: "16px",
                      height: "16px",
                      cursor: "pointer",
                    }}
                  />
                  <label
                    htmlFor="isActiveCheck"
                    style={{
                      fontSize: "13px",
                      color: colors.textPrimary,
                      cursor: "pointer",
                    }}
                  >
                    Active & Display immediately on commuter map dashboard
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div
                className="modal-footer"
                style={{
                  borderTop: `1px solid ${colors.border}`,
                  paddingTop: "16px",
                  display: "flex",
                  justifyContent: editingTerminal
                    ? "space-between"
                    : "flex-end",
                  alignItems: "center",
                }}
              >
                {editingTerminal && (
                  <button
                    type="button"
                    onClick={() => {
                      const termToDelete = editingTerminal;
                      setModalOpen(false);
                      handleDeleteTerminal(termToDelete);
                    }}
                    className="btn btn-sm"
                    style={{
                      backgroundColor: "#FEE2E2",
                      color: "#DC2626",
                      border: "1px solid #FECACA",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 14px",
                      fontSize: "13px",
                      fontWeight: "600",
                      borderRadius: "8px",
                      cursor: "pointer",
                    }}
                    title="Delete Terminal"
                  >
                    <Trash2 size={15} />
                    <span>Delete Terminal</span>
                  </button>
                )}

                <div style={{ display: "flex", gap: "8px" }}>
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
                    className="btn"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      backgroundColor: colors.primary,
                      color: colors.white,
                      boxShadow: `0 4px 12px ${colors.primary}50`,
                    }}
                  >
                    <Check size={16} />
                    <span>
                      {saving
                        ? "Saving Terminal..."
                        : editingTerminal
                          ? "Save Changes"
                          : "Create Terminal"}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
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

export default TerminalsPage;
