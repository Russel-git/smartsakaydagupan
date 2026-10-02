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
      distance = route.distanceKm;
      routeName = route.name;
    }
    if (!distance || distance <= 0) return apiResponse.error(res, 'Valid distance is required', 400);

    const fare = await Fare.findOne({ vehicleType, isActive: true });
    if (!fare) return apiResponse.error(res, `No active fare for vehicle type: ${vehicleType}`, 404);

    const discount = discountType !== 'none' ? discountType : null;
    const result = fareCalculator.calculate(distance, fare.baseFare, fare.baseDistanceKm, fare.perKmRate, discount);

    return apiResponse.success(res, { routeName, vehicleType, ...result }, 'Fare calculated successfully');
  } catch (error) { next(error); }
};

const getFareMatrix = async (req, res, next) => {
  try {
    const matrix = await FareMatrix.find({ isActive: true })
      .populate('routeId', 'name code category distanceKm').sort({ 'routeId.name': 1 });
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
    const notifications = commuters.map((user) => ({
      userId: user._id, title: 'Fare Rate Updated',
      message: `${newFare.vehicleType.charAt(0).toUpperCase() + newFare.vehicleType.slice(1)} jeepney fare has been updated. Base fare: ₱${newFare.baseFare}, per km: ₱${newFare.perKmRate}`,
      type: 'fare_update', metadata: { fareId: newFare._id },
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
      },
    });

    return apiResponse.success(res, newFare, 'Fare updated and matrix recalculated');

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

module.exports = { getActiveFares, calculateFare, getFareMatrix, updateFare, getFareHistory };
