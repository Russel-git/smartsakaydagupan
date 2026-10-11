const fareSeedData = [
  {
    vehicleType: 'traditional',
    baseFare: 13,
    baseDistanceKm: 4,
    perKmRate: 1.80,
    discounts: { student: 0.20, seniorCitizen: 0.20, pwd: 0.20 },
    effectiveDate: new Date('2026-03-19'),
    memorandumRef: 'LTFRB Memorandum Circular / Official Fare Matrix',
    source: 'LTFRB',
    isActive: true,
  },
  {
    vehicleType: 'modern',
    baseFare: 15,
    baseDistanceKm: 4,
    perKmRate: 2.20,
    discounts: { student: 0.20, seniorCitizen: 0.20, pwd: 0.20 },
    effectiveDate: new Date('2026-03-19'),
    memorandumRef: 'LTFRB Memorandum Circular / Official Fare Matrix',
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
    memorandumRef: 'Dagupan City TFRB Tariff Ordinance',
    source: 'Dagupan City TFRB',
    isActive: false,
  },
];

module.exports = fareSeedData;
