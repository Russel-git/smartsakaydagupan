const Fare = require('../models/Fare');

const calculate = (distanceKm, baseFare, baseDistanceKm, perKmRate, discountType = null) => {
  let fare;
  if (distanceKm <= baseDistanceKm) {
    fare = baseFare;
  } else {
    fare = baseFare + (distanceKm - baseDistanceKm) * perKmRate;
  }

  let discountRate = 0;
  if (discountType === 'student' || discountType === 'senior' || discountType === 'pwd' || discountType === 'discounted') {
    discountRate = 0.20;
  }

  const regularFare = Math.ceil(fare);
  const discountedFare = discountRate > 0 ? Math.ceil(fare * (1 - discountRate)) : regularFare;

  return {
    regularFare,
    discountedFare,
    discountRate,
    breakdown: {
      baseFare,
      baseDistanceKm,
      perKmRate,
      distanceKm,
      extraKm: Math.max(0, distanceKm - baseDistanceKm),
      extraCharge: Math.max(0, (distanceKm - baseDistanceKm) * perKmRate),
      subtotal: fare,
      discount: discountRate > 0 ? fare * discountRate : 0,
    },
  };
};

const calculateForRoute = async (routeDistanceKm, vehicleType, discountType = null) => {
  const fare = await Fare.findOne({ vehicleType, isActive: true });
  if (!fare) {
    throw new Error(`No active fare found for vehicle type: ${vehicleType}`);
  }
  return calculate(routeDistanceKm, fare.baseFare, fare.baseDistanceKm, fare.perKmRate, discountType);
};

module.exports = { calculate, calculateForRoute };
