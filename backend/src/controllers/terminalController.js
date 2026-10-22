const Terminal = require("../models/Terminal");
const terminalSeeds = require("../seeds/terminalSeeds");
const apiResponse = require("../utils/apiResponse");
const { logAuditEvent } = require("../utils/auditLogger");

// Helper to calculate distance in km using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

const reverseGeocodeServer = async (lat, lng) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      {
        signal: controller.signal,
        headers: {
          "User-Agent": "SmartSakay-Server/1.0",
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

// Terminals are exclusively managed and pinpointed by the admin (no auto-seeding)
const ensureTerminalsSeeded = async () => {
  return;
};

const getAllTerminals = async (req, res, next) => {
  try {
    const { type, search, lat, lng, includeInactive } = req.query;
    const filter = {};

    if (!includeInactive || includeInactive === "false") {
      filter.isActive = true;
    }

    if (type && type !== "all") {
      filter.type = type;
    }

    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { company: { $regex: escaped, $options: "i" } },
        { address: { $regex: escaped, $options: "i" } },
        { destinations: { $elemMatch: { $regex: escaped, $options: "i" } } },
      ];
    }

    let terminals = await Terminal.find(filter).sort({ name: 1 }).lean();

    // If commuter coordinates provided, calculate distance
    if (lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
      const uLat = Number(lat);
      const uLng = Number(lng);
      terminals = terminals.map((t) => ({
        ...t,
        distanceKm: calculateDistance(uLat, uLng, t.lat, t.lng),
      }));
      terminals.sort((a, b) => a.distanceKm - b.distanceKm);
    }

    return apiResponse.success(
      res,
      terminals,
      "Terminals retrieved successfully",
    );
  } catch (error) {
    next(error);
  }
};

const getTerminalById = async (req, res, next) => {
  try {
    const terminal = await Terminal.findById(req.params.id);
    if (!terminal) {
      return apiResponse.error(res, "Terminal not found", 404);
    }
    return apiResponse.success(res, terminal, "Terminal details retrieved");
  } catch (error) {
    next(error);
  }
};

const createTerminal = async (req, res, next) => {
  try {
    if (!req.body.address || !req.body.address.trim()) {
      const detected = await reverseGeocodeServer(req.body.lat, req.body.lng);
      req.body.address =
        detected ||
        `${req.body.name || "Transit"} Terminal (${Number(req.body.lat).toFixed(4)}, ${Number(req.body.lng).toFixed(4)})`;
    }

    const terminal = await Terminal.create(req.body);

    await logAuditEvent(req, {
      action: "TERMINAL_CREATE",
      resourceType: "terminal",
      resourceId: terminal._id,
      details: {
        name: terminal.name,
        type: terminal.type,
        address: terminal.address,
      },
    });

    return apiResponse.success(
      res,
      terminal,
      "Terminal created successfully",
      201,
    );
  } catch (error) {
    next(error);
  }
};

const updateTerminal = async (req, res, next) => {
  try {
    if (
      req.body.lat &&
      req.body.lng &&
      (!req.body.address || !req.body.address.trim())
    ) {
      const detected = await reverseGeocodeServer(req.body.lat, req.body.lng);
      if (detected) req.body.address = detected;
    }

    const terminal = await Terminal.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!terminal) {
      return apiResponse.error(res, "Terminal not found", 404);
    }

    await logAuditEvent(req, {
      action: "TERMINAL_UPDATE",
      resourceType: "terminal",
      resourceId: terminal._id,
      details: { name: terminal.name, type: terminal.type, changes: req.body },
    });

    return apiResponse.success(res, terminal, "Terminal updated successfully");
  } catch (error) {
    next(error);
  }
};

const deleteTerminal = async (req, res, next) => {
  try {
    const terminal = await Terminal.findByIdAndDelete(req.params.id);
    if (!terminal) {
      return apiResponse.error(res, "Terminal not found", 404);
    }

    await logAuditEvent(req, {
      action: "TERMINAL_DELETE",
      resourceType: "terminal",
      resourceId: req.params.id,
      details: { name: terminal.name },
    });

    return apiResponse.success(res, null, "Terminal deleted successfully");
  } catch (error) {
    next(error);
  }
};

const clearAllTerminals = async (req, res, next) => {
  try {
    const result = await Terminal.deleteMany({});
    await logAuditEvent(req, {
      action: "TERMINAL_CLEAR_ALL",
      resourceType: "terminal",
      details: { deletedCount: result.deletedCount },
    });
    return apiResponse.success(
      res,
      { deletedCount: result.deletedCount },
      "All terminals removed successfully",
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTerminals,
  getTerminalById,
  createTerminal,
  updateTerminal,
  deleteTerminal,
  clearAllTerminals,
  ensureTerminalsSeeded,
};
