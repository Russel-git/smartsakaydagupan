const Terminal = require('../models/Terminal');
const terminalSeeds = require('../seeds/terminalSeeds');
const apiResponse = require('../utils/apiResponse');
const { logAuditEvent } = require('../utils/auditLogger');

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

// Terminals are exclusively managed and pinpointed by the admin (no auto-seeding)
const ensureTerminalsSeeded = async () => {
  return;
};

const getAllTerminals = async (req, res, next) => {
  try {
    const { type, search, lat, lng, includeInactive, municipality } = req.query;
    const filter = {};

    if (!includeInactive || includeInactive === 'false') {
      filter.isActive = true;
    }

    if (type && type !== 'all') {
      filter.type = type;
    }

    // Jurisdictional isolation: LGU / POSO only see terminals in their municipality
    let targetMuni = municipality;
    if (req.user && (req.user.role === 'lgu' || req.user.role === 'poso')) {
      targetMuni = req.user.municipality || 'Dagupan';
    }

    if (targetMuni && targetMuni !== 'all') {
      const cleanMuni = targetMuni.trim();
      if (cleanMuni.toLowerCase() === 'dagupan') {
        filter.$and = filter.$and || [];
        filter.$and.push({
          $or: [
            { municipality: cleanMuni },
            { municipality: { $exists: false } },
          ],
        });
      } else {
        filter.municipality = cleanMuni;
      }
    }

    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchOr = [
        { name: { $regex: escaped, $options: 'i' } },
        { company: { $regex: escaped, $options: 'i' } },
        { address: { $regex: escaped, $options: 'i' } },
        { destinations: { $elemMatch: { $regex: escaped, $options: 'i' } } },
      ];
      if (filter.$and) {
        filter.$and.push({ $or: searchOr });
      } else {
        filter.$or = searchOr;
      }
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

    return apiResponse.success(res, terminals, 'Terminals retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getTerminalById = async (req, res, next) => {
  try {
    const terminal = await Terminal.findById(req.params.id);
    if (!terminal) {
      return apiResponse.error(res, 'Terminal not found', 404);
    }

    if (req.user && (req.user.role === 'lgu' || req.user.role === 'poso')) {
      const userMuni = (req.user.municipality || 'Dagupan').trim();
      if (terminal.municipality !== userMuni) {
        return apiResponse.error(res, 'Access denied. Terminal outside your jurisdiction.', 403);
      }
    }

    return apiResponse.success(res, terminal, 'Terminal details retrieved');
  } catch (error) {
    next(error);
  }
};

const createTerminal = async (req, res, next) => {
  try {
    if (req.user && req.user.role === 'lgu') {
      req.body.municipality = req.user.municipality || 'Dagupan';
    }

    const terminal = await Terminal.create(req.body);

    await logAuditEvent(req, {
      action: 'TERMINAL_CREATE',
      resourceType: 'terminal',
      resourceId: terminal._id,
      details: { name: terminal.name, type: terminal.type, address: terminal.address, municipality: terminal.municipality },
    });

    return apiResponse.success(res, terminal, 'Terminal created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateTerminal = async (req, res, next) => {
  try {
    if (req.user && req.user.role === 'lgu') {
      const existing = await Terminal.findById(req.params.id);
      if (!existing) return apiResponse.error(res, 'Terminal not found', 404);
      const userMuni = (req.user.municipality || 'Dagupan').trim();
      if (existing.municipality !== userMuni) {
        return apiResponse.error(res, 'Access denied. You can only update terminals within your municipality jurisdiction.', 403);
      }
      req.body.municipality = userMuni;
    }

    const terminal = await Terminal.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!terminal) {
      return apiResponse.error(res, 'Terminal not found', 404);
    }

    await logAuditEvent(req, {
      action: 'TERMINAL_UPDATE',
      resourceType: 'terminal',
      resourceId: terminal._id,
      details: { name: terminal.name, type: terminal.type, changes: req.body },
    });

    return apiResponse.success(res, terminal, 'Terminal updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteTerminal = async (req, res, next) => {
  try {
    if (req.user && req.user.role === 'lgu') {
      const existing = await Terminal.findById(req.params.id);
      if (!existing) return apiResponse.error(res, 'Terminal not found', 404);
      const userMuni = (req.user.municipality || 'Dagupan').trim();
      if (existing.municipality !== userMuni) {
        return apiResponse.error(res, 'Access denied. You can only delete terminals within your municipality jurisdiction.', 403);
      }
    }

    const terminal = await Terminal.findByIdAndDelete(req.params.id);
    if (!terminal) {
      return apiResponse.error(res, 'Terminal not found', 404);
    }

    await logAuditEvent(req, {
      action: 'TERMINAL_DELETE',
      resourceType: 'terminal',
      resourceId: req.params.id,
      details: { name: terminal.name },
    });

    return apiResponse.success(res, null, 'Terminal deleted successfully');
  } catch (error) {
    next(error);
  }
};

const clearAllTerminals = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user && req.user.role === 'lgu') {
      filter.municipality = req.user.municipality || 'Dagupan';
    }

    const result = await Terminal.deleteMany(filter);
    await logAuditEvent(req, {
      action: 'TERMINAL_CLEAR_ALL',
      resourceType: 'terminal',
      details: { deletedCount: result.deletedCount, filter },
    });
    return apiResponse.success(res, { deletedCount: result.deletedCount }, 'Terminals removed successfully');
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
