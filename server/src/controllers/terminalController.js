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
    const { type, search, lat, lng, includeInactive } = req.query;
    const filter = {};

    if (!includeInactive || includeInactive === 'false') {
      filter.isActive = true;
    }

    if (type && type !== 'all') {
      filter.type = type;
    }

    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { company: { $regex: search.trim(), $options: 'i' } },
        { address: { $regex: search.trim(), $options: 'i' } },
        { destinations: { $elemMatch: { $regex: search.trim(), $options: 'i' } } },
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
    return apiResponse.success(res, terminal, 'Terminal details retrieved');
  } catch (error) {
    next(error);
  }
};

const createTerminal = async (req, res, next) => {
  try {
    const terminal = await Terminal.create(req.body);

    await logAuditEvent(req, {
      action: 'TERMINAL_CREATE',
      resourceType: 'terminal',
      resourceId: terminal._id,
      details: { name: terminal.name, type: terminal.type, address: terminal.address },
    });

    return apiResponse.success(res, terminal, 'Terminal created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateTerminal = async (req, res, next) => {
  try {
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
    const result = await Terminal.deleteMany({});
    await logAuditEvent(req, {
      action: 'TERMINAL_CLEAR_ALL',
      resourceType: 'terminal',
      details: { deletedCount: result.deletedCount },
    });
    return apiResponse.success(res, { deletedCount: result.deletedCount }, 'All terminals removed successfully');
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
