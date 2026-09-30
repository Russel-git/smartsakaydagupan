const Route = require('../models/Route');
const FareMatrix = require('../models/FareMatrix');
const Fare = require('../models/Fare');
const Terminal = require('../models/Terminal');
const fareCalculator = require('../services/fareCalculator');
const apiResponse = require('../utils/apiResponse');
const { logAuditEvent } = require('../utils/auditLogger');

// Dedicated Dagupan Bus Terminals Data (strictly for buses as per specification)
const DAGUPAN_BUS_TERMINALS = [
  {
    id: 'bt-victory-liner',
    name: 'Victory Liner Terminal',
    company: 'Victory Liner, Inc.',
    type: 'bus',
    address: 'Perez Boulevard, Herrero-Perez, Dagupan City, Pangasinan',
    lat: 16.0392,
    lng: 120.3418,
    contactNumber: '(075) 522-0929',
    operatingHours: '24 Hours (Daily)',
    destinations: ['Cubao', 'Pasay', 'Baguio City', 'Olongapo', 'Clark Airport', 'Tuguegarao'],
    amenities: ['Air-conditioned Waiting Area', 'Free Public Wi-Fi', 'Clean Restrooms (RA 11311)', 'Baggage Deposit Counter', 'Ticket Booking Booth'],
    description: 'Premier provincial bus terminal serving northern Luzon and Metro Manila routes.',
  },
  {
    id: 'bt-five-star',
    name: 'Five Star Bus Terminal',
    company: 'Five Star Bus Company',
    type: 'bus',
    address: 'Perez Boulevard, Dagupan City, Pangasinan',
    lat: 16.0385,
    lng: 120.3402,
    contactNumber: '(075) 522-8618',
    operatingHours: '03:00 AM - 11:00 PM',
    destinations: ['Cubao', 'Pasay', 'Avenida (Manila)', 'Cabanatuan', 'San Jose, Nueva Ecija'],
    amenities: ['Spacious Waiting Hall', 'Restroom Facilities', 'Canteen / Snack Kiosks', 'Express Cargo Counter'],
    description: 'Direct air-conditioned and regular provincial bus trips across Central and Northern Luzon.',
  },
  {
    id: 'bt-solid-north',
    name: 'Solid North Transit Terminal',
    company: 'Solid North Bus Lines',
    type: 'bus',
    address: 'Perez Boulevard, Dagupan City, Pangasinan',
    lat: 16.0401,
    lng: 120.3425,
    contactNumber: '(075) 522-3841',
    operatingHours: '04:00 AM - 10:00 PM',
    destinations: ['PITX (Parañaque Integrated Terminal)', 'Cubao', 'Kamuning', 'Tarlac City', 'Capas'],
    amenities: ['Point-to-Point (P2P) Luxury Coaches', 'Free High-speed Wi-Fi', 'Clean Restrooms', 'Online Ticket Validation'],
    description: 'Fast Point-to-Point (P2P) and regular bus service directly to PITX and Metro Manila via TPLEX.',
  },
  {
    id: 'bt-genesis-joybus',
    name: 'Genesis Transport / JoyBus Executive Terminal',
    company: 'Genesis Transport Service Inc.',
    type: 'bus',
    address: 'M.H. Del Pilar Street, Downtown, Dagupan City, Pangasinan',
    lat: 16.0441,
    lng: 120.3355,
    contactNumber: '(075) 523-1188',
    operatingHours: '24 Hours',
    destinations: ['Baguio City', 'Cubao', 'Avenida', 'Pasay', 'Clark International Airport'],
    amenities: ['JoyBus Luxury Executive Lounge', 'On-board Restrooms', 'Priority Seating', 'Wi-Fi & Charging Ports'],
    description: 'Executive non-stop luxury bus service to Baguio and Metro Manila terminals.',
  },
  {
    id: 'bt-dagupan-bus',
    name: 'Dagupan Bus Co. Terminal',
    company: 'Dagupan Bus Company, Inc.',
    type: 'bus',
    address: 'Perez Boulevard, Dagupan City, Pangasinan',
    lat: 16.0378,
    lng: 120.3395,
    contactNumber: '(075) 522-1234',
    operatingHours: '04:00 AM - 09:00 PM',
    destinations: ['Cubao', 'Pasay', 'Baguio City', 'Vigan', 'Laoag'],
    amenities: ['Covered Waiting Area', 'Ticketing Counter', 'Restroom', 'Parcel Services'],
    description: 'Historic bus liner providing reliable trips throughout the Ilocos Region and Metro Manila.',
  },
];

const getBusTerminals = async (req, res, next) => {
  try {
    const { lat, lng } = req.query;
    let terminals = (await Terminal.find({ isActive: true }).lean()) || [];

    if (lat && lng) {
      const toRad = (deg) => (deg * Math.PI) / 180;
      const haversine = (lat1, lng1, lat2, lng2) => {
        const R = 6371;
        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      };

      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);

      terminals = terminals.map((t) => ({
        ...t,
        distanceKm: Math.round(haversine(userLat, userLng, t.lat, t.lng) * 100) / 100,
      })).sort((a, b) => a.distanceKm - b.distanceKm);
    }

    return apiResponse.success(res, terminals, 'Bus terminals retrieved successfully');
  } catch (error) { next(error); }
};

const getAllRoutes = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const routes = await Route.find(filter).sort({ category: 1, name: 1 });
    const routesWithFares = await Promise.all(
      routes.map(async (route) => {
        const fareMatrix = await FareMatrix.find({ routeId: route._id, isActive: true });
        return { ...route.toObject(), fares: fareMatrix };
      })
    );
    return apiResponse.success(res, routesWithFares, 'Routes retrieved');
  } catch (error) { next(error); }
};

const getRouteById = async (req, res, next) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) return apiResponse.error(res, 'Route not found', 404);
    const fareMatrix = await FareMatrix.find({ routeId: route._id, isActive: true });
    return apiResponse.success(res, { ...route.toObject(), fares: fareMatrix }, 'Route retrieved');
  } catch (error) { next(error); }
};

const getNearbyRoutes = async (req, res, next) => {
  try {
    const { lat, lng, radiusKm = 5 } = req.query;
    if (!lat || !lng) return apiResponse.error(res, 'Latitude and longitude are required', 400);

    const routes = await Route.find({ isActive: true });
    const toRad = (deg) => (deg * Math.PI) / 180;
    const haversine = (lat1, lng1, lat2, lng2) => {
      const R = 6371;
      const dLat = toRad(lat2 - lat1);
      const dLng = toRad(lng2 - lng1);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const userLat = parseFloat(lat), userLng = parseFloat(lng), radius = parseFloat(radiusKm);
    const nearbyRoutes = routes
      .map((route) => {
        const distToStart = haversine(userLat, userLng, route.startPoint.lat, route.startPoint.lng);
        const distToEnd = haversine(userLat, userLng, route.endPoint.lat, route.endPoint.lng);
        return { ...route.toObject(), distanceFromUser: Math.round(Math.min(distToStart, distToEnd) * 100) / 100 };
      })
      .filter((r) => r.distanceFromUser <= radius)
      .sort((a, b) => a.distanceFromUser - b.distanceFromUser);

    return apiResponse.success(res, nearbyRoutes, 'Nearby routes retrieved');
  } catch (error) { next(error); }
};

const createRoute = async (req, res, next) => {
  try {
    const route = await Route.create(req.body);
    const activeFares = await Fare.find({ isActive: true });
    for (const fare of activeFares) {
      const regResult = fareCalculator.calculate(route.distanceKm, fare.baseFare, fare.baseDistanceKm, fare.perKmRate);
      const discResult = fareCalculator.calculate(route.distanceKm, fare.baseFare, fare.baseDistanceKm, fare.perKmRate, 'student');
      await FareMatrix.create({
        routeId: route._id, fareId: fare._id, vehicleType: fare.vehicleType,
        regularFare: regResult.regularFare, discountedFare: discResult.discountedFare,
        distanceKm: route.distanceKm, isActive: true,
      });
    }

    await logAuditEvent(req, {
      action: 'ROUTE_CREATE',
      resourceType: 'route',
      resourceId: route._id,
      details: { name: route.name, code: route.code, category: route.category, distanceKm: route.distanceKm },
    });

    return apiResponse.success(res, route, 'Route created', 201);
  } catch (error) { next(error); }
};

const updateRoute = async (req, res, next) => {
  try {
    const route = await Route.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!route) return apiResponse.error(res, 'Route not found', 404);
    if (req.body.distanceKm) {
      await FareMatrix.updateMany({ routeId: route._id, isActive: true }, { isActive: false });
      const activeFares = await Fare.find({ isActive: true });
      for (const fare of activeFares) {
        const regResult = fareCalculator.calculate(route.distanceKm, fare.baseFare, fare.baseDistanceKm, fare.perKmRate);
        const discResult = fareCalculator.calculate(route.distanceKm, fare.baseFare, fare.baseDistanceKm, fare.perKmRate, 'student');
        await FareMatrix.create({
          routeId: route._id, fareId: fare._id, vehicleType: fare.vehicleType,
          regularFare: regResult.regularFare, discountedFare: discResult.discountedFare,
          distanceKm: route.distanceKm, isActive: true,
        });
      }
    }

    await logAuditEvent(req, {
      action: 'ROUTE_UPDATE',
      resourceType: 'route',
      resourceId: route._id,
      details: req.body,
    });

    return apiResponse.success(res, route, 'Route updated');
  } catch (error) { next(error); }
};

const deleteRoute = async (req, res, next) => {
  try {
    const route = await Route.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!route) return apiResponse.error(res, 'Route not found', 404);
    await FareMatrix.updateMany({ routeId: route._id }, { isActive: false });

    await logAuditEvent(req, {
      action: 'ROUTE_DELETE',
      resourceType: 'route',
      resourceId: route._id,
      details: { name: route.name, code: route.code },
    });

    return apiResponse.success(res, null, 'Route deleted');
  } catch (error) { next(error); }
};

module.exports = {
  getAllRoutes,
  getRouteById,
  getNearbyRoutes,
  getBusTerminals,
  createRoute,
  updateRoute,
  deleteRoute,
};

