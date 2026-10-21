const Fare = require('../models/Fare');
const FareMatrix = require('../models/FareMatrix');
const Route = require('../models/Route');
const Notification = require('../models/Notification');
const User = require('../models/User');
const fareCalculator = require('../services/fareCalculator');
const apiResponse = require('../utils/apiResponse');
const { logAuditEvent } = require('../utils/auditLogger');


const getActiveFares = async (req, res, next) => {
  try {
    const fares = await Fare.find({ isActive: true });
    return apiResponse.success(res, fares, 'Active fare rates retrieved');
  } catch (error) { next(error); }
};

const calculateFare = async (req, res, next) => {
  try {
    const { routeId, distanceKm, vehicleType, discountType } = req.query;
    let distance = parseFloat(distanceKm);
    let routeName = null;

    if (routeId) {
      const route = await Route.findById(routeId);
      if (!route) return apiResponse.error(res, 'Route not found', 404);
      routeName = route.name;
      if (!distance || isNaN(distance) || distance <= 0) {
        distance = route.distanceKm;
      }
    }
    if (!distance || distance <= 0) return apiResponse.error(res, 'Valid distance is required', 400);

    let vType = vehicleType || 'traditional';
    if (vType === 'traditional_jeepney') vType = 'traditional';
    if (vType === 'modern_jeepney') vType = 'modern';

    let fare = await Fare.findOne({ vehicleType: vType, isActive: true });
    if (!fare) {
      fare = await Fare.findOne({ vehicleType: 'traditional', isActive: true }) || await Fare.findOne({ isActive: true });
    }
    if (!fare) return apiResponse.error(res, `No active fare rates found`, 404);

    const discount = discountType !== 'none' ? discountType : null;
    const result = fareCalculator.calculate(distance, fare.baseFare, fare.baseDistanceKm, fare.perKmRate, discount);

    return apiResponse.success(res, { routeName, vehicleType, ...result }, 'Fare calculated successfully');
  } catch (error) { next(error); }
};

const getFareMatrix = async (req, res, next) => {
  try {
    let targetMuni = req.query.municipality;
    if (req.user && (req.user.role === 'lgu' || req.user.role === 'poso')) {
      targetMuni = req.user.municipality || 'Dagupan';
    } else if (req.user && req.user.role === 'commuter') {
      targetMuni = req.user.municipality || targetMuni || 'Dagupan';
    }

    let matrix = await FareMatrix.find({ isActive: true })
      .populate('routeId', 'name code category distanceKm municipalities')
      .sort({ 'routeId.name': 1 });

    if (targetMuni && targetMuni !== 'all') {
      const cleanMuni = targetMuni.trim().toLowerCase();
      matrix = matrix.filter((item) => {
        if (!item.routeId) return false;
        const munis = item.routeId.municipalities || [];
        if (cleanMuni === 'dagupan') {
          return munis.length === 0 || munis.some((m) => m.toLowerCase() === 'dagupan');
        }
        return munis.some((m) => m.toLowerCase() === cleanMuni);
      });
    }

    return apiResponse.success(res, matrix, 'Fare matrix retrieved');
  } catch (error) { next(error); }
};

const updateFare = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const oldFare = await Fare.findById(id);
    if (!oldFare) return apiResponse.error(res, 'Fare not found', 404);

    oldFare.isActive = false;
    await oldFare.save();

    const newFare = await Fare.create({
      vehicleType: oldFare.vehicleType,
      baseFare: updates.baseFare, baseDistanceKm: updates.baseDistanceKm, perKmRate: updates.perKmRate,
      discounts: updates.discounts || oldFare.discounts,
      effectiveDate: updates.effectiveDate || new Date(),
      memorandumRef: updates.memorandumRef || '', source: oldFare.source, isActive: true,
    });

    const routes = await Route.find({ isActive: true });
    await FareMatrix.updateMany({ vehicleType: newFare.vehicleType, isActive: true }, { isActive: false });

    for (const route of routes) {
      const result = fareCalculator.calculate(route.distanceKm, newFare.baseFare, newFare.baseDistanceKm, newFare.perKmRate);
      await FareMatrix.create({
        routeId: route._id, fareId: newFare._id, vehicleType: newFare.vehicleType,
        regularFare: result.regularFare, discountedFare: result.discountedFare,
        distanceKm: route.distanceKm, isActive: true,
      });
    }

    const commuters = await User.find({ role: 'commuter', isActive: true }).select('_id');
    const effDateFormatted = new Date(newFare.effectiveDate).toLocaleDateString();
    const notifications = commuters.map((user) => ({
      userId: user._id,
      title: 'Fare Rate Updated',
      message: `${newFare.vehicleType.charAt(0).toUpperCase() + newFare.vehicleType.slice(1)} jeepney fare updated: ₱${newFare.baseFare.toFixed(2)} base, +₱${newFare.perKmRate.toFixed(2)}/km. Effective: ${effDateFormatted}.`,
      type: 'fare_update',
      metadata: { fareId: newFare._id, effectiveDate: newFare.effectiveDate },
    }));
    if (notifications.length > 0) await Notification.insertMany(notifications);

    await logAuditEvent(req, {
      action: 'FARE_UPDATE',
      resourceType: 'fare',
      resourceId: newFare._id,
      details: {
        vehicleType: newFare.vehicleType,
        previousBaseFare: oldFare.baseFare,
        newBaseFare: newFare.baseFare,
        previousPerKm: oldFare.perKmRate,
        newPerKm: newFare.perKmRate,
        effectiveDate: newFare.effectiveDate,
      },
    });

    return apiResponse.success(res, newFare, 'Fare updated and matrix recalculated');

  } catch (error) { next(error); }
};

const revertFare = async (req, res, next) => {
  try {
    const { vehicleType } = req.params;
    let targetVehicle = vehicleType || 'traditional';
    if (targetVehicle === 'traditional_jeepney') targetVehicle = 'traditional';
    if (targetVehicle === 'modern_jeepney') targetVehicle = 'modern';

    const currentActive = await Fare.findOne({ vehicleType: targetVehicle, isActive: true });
    if (!currentActive) return apiResponse.error(res, `No active tariff found for ${targetVehicle}`, 404);

    // Find the most recently superseded fare record
    const previousFare = await Fare.findOne({
      vehicleType: targetVehicle,
      isActive: false,
      _id: { $ne: currentActive._id },
    }).sort({ createdAt: -1 });

    if (!previousFare) {
      return apiResponse.error(res, `No previous tariff revision available in history to revert to.`, 400);
    }

    currentActive.isActive = false;
    await currentActive.save();

    previousFare.isActive = true;
    await previousFare.save();

    // Recalculate route matrix for restored tariff
    const routes = await Route.find({ isActive: true });
    await FareMatrix.updateMany({ vehicleType: previousFare.vehicleType, isActive: true }, { isActive: false });

    for (const route of routes) {
      const result = fareCalculator.calculate(route.distanceKm, previousFare.baseFare, previousFare.baseDistanceKm, previousFare.perKmRate);
      await FareMatrix.create({
        routeId: route._id,
        fareId: previousFare._id,
        vehicleType: previousFare.vehicleType,
        regularFare: result.regularFare,
        discountedFare: result.discountedFare,
        distanceKm: route.distanceKm,
        isActive: true,
      });
    }

    // Notify all active commuters
    const commuters = await User.find({ role: 'commuter', isActive: true }).select('_id');
    const effDateFormatted = new Date(previousFare.effectiveDate).toLocaleDateString();
    const notifications = commuters.map((user) => ({
      userId: user._id,
      title: 'Fare Rate Reverted',
      message: `${previousFare.vehicleType.charAt(0).toUpperCase() + previousFare.vehicleType.slice(1)} jeepney fare restored to: ₱${previousFare.baseFare.toFixed(2)} base, +₱${previousFare.perKmRate.toFixed(2)}/km. Effective: ${effDateFormatted}.`,
      type: 'fare_update',
      metadata: { fareId: previousFare._id, effectiveDate: previousFare.effectiveDate, reverted: true },
    }));
    if (notifications.length > 0) await Notification.insertMany(notifications);

    await logAuditEvent(req, {
      action: 'FARE_REVERT',
      resourceType: 'fare',
      resourceId: previousFare._id,
      details: {
        vehicleType: previousFare.vehicleType,
        restoredBaseFare: previousFare.baseFare,
        restoredPerKm: previousFare.perKmRate,
        previousBaseFare: currentActive.baseFare,
        previousPerKm: currentActive.perKmRate,
      },
    });

    return apiResponse.success(res, previousFare, `Tariff rate for ${previousFare.vehicleType} successfully reverted to previous revision.`);
  } catch (error) { next(error); }
};

const getFareHistory = async (req, res, next) => {
  try {
    const { vehicleType } = req.query;
    const filter = {};
    if (vehicleType) filter.vehicleType = vehicleType;
    const history = await Fare.find(filter).sort({ createdAt: -1 });
    return apiResponse.success(res, history, 'Fare history retrieved');
  } catch (error) { next(error); }
};

module.exports = { getActiveFares, calculateFare, getFareMatrix, updateFare, revertFare, getFareHistory };
