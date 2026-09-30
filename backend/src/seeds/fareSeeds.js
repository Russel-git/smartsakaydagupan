const fareSeedData = [
  {
    vehicleType: 'traditional',
    baseFare: 14,
    baseDistanceKm: 4,
    perKmRate: 2.00,
    discounts: { student: 0.20, seniorCitizen: 0.20, pwd: 0.20 },
    effectiveDate: new Date('2026-03-19'),
    memorandumRef: 'LTFRB Order dated March 13, 2026',
    source: 'LTFRB',
    isActive: true,
  },
  {
    vehicleType: 'modern',
    baseFare: 17,
    baseDistanceKm: 4,
    perKmRate: 2.40,
    discounts: { student: 0.20, seniorCitizen: 0.20, pwd: 0.20 },
    effectiveDate: new Date('2026-03-19'),
    memorandumRef: 'LTFRB Order dated March 13, 2026',
    source: 'LTFRB',
    isActive: true,
  },
  {
    vehicleType: 'tricycle',
    baseFare: 15,
    baseDistanceKm: 1,
    perKmRate: 3.00,
    discounts: { student: 0.20, seniorCitizen: 0.20, pwd: 0.20 },
    effectiveDate: new Date('2026-03-19'),
    memorandumRef: 'Dagupan City TFRB Tariff Ordinance / LTFRB Guidelines',
    source: 'LTFRB & Dagupan City TFRB',
    isActive: true,
  },
];

module.exports = fareSeedData;
