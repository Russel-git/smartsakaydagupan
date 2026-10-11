const fareCalculator = require('../../src/services/fareCalculator');

describe('Official LTFRB Fare Matrix Engine', () => {
  // Official LTFRB rates
  const TRADITIONAL_BASE = 13.00;
  const TRADITIONAL_PER_KM = 1.80;
  const MODERN_BASE = 15.00;
  const MODERN_PER_KM = 2.20;
  const BASE_DIST_KM = 4.0;

  describe('Traditional PUJ Tariff', () => {
    it('computes exact base fare within 4 km', () => {
      const result = fareCalculator.calculate(3.5, TRADITIONAL_BASE, BASE_DIST_KM, TRADITIONAL_PER_KM);
      expect(result.regularFare).toBe(13);
      expect(result.discountedFare).toBe(13); // No discount specified
    });

    it('computes 20% statutory discount for student/senior/pwd within 4 km', () => {
      const result = fareCalculator.calculate(4.0, TRADITIONAL_BASE, BASE_DIST_KM, TRADITIONAL_PER_KM, 'student');
      // 13 * 0.8 = 10.4 -> ceil = 11 (or 10.40 raw)
      expect(result.regularFare).toBe(13);
      expect(result.discountedFare).toBe(Math.ceil(13 * 0.8)); // 11
    });

    it('computes succeeding km rate beyond 4 km correctly', () => {
      // 7 km: 4 km base (13) + 3 km * 1.80 (5.40) = 18.40 -> ceil = 19
      const result = fareCalculator.calculate(7.0, TRADITIONAL_BASE, BASE_DIST_KM, TRADITIONAL_PER_KM);
      expect(result.regularFare).toBe(19);
      expect(result.breakdown.subtotal).toBeCloseTo(18.40, 2);
    });
  });

  describe('Modern PUJ Tariff', () => {
    it('computes exact base fare within 4 km', () => {
      const result = fareCalculator.calculate(2.0, MODERN_BASE, BASE_DIST_KM, MODERN_PER_KM);
      expect(result.regularFare).toBe(15);
    });

    it('computes 20% statutory discount for student/senior/pwd within 4 km', () => {
      const result = fareCalculator.calculate(4.0, MODERN_BASE, BASE_DIST_KM, MODERN_PER_KM, 'senior');
      // 15 * 0.8 = 12.00 -> 12
      expect(result.regularFare).toBe(15);
      expect(result.discountedFare).toBe(12);
    });

    it('computes succeeding km rate beyond 4 km correctly', () => {
      // 6 km: 4 km base (15) + 2 km * 2.20 (4.40) = 19.40 -> ceil = 20
      const result = fareCalculator.calculate(6.0, MODERN_BASE, BASE_DIST_KM, MODERN_PER_KM);
      expect(result.regularFare).toBe(20);
      expect(result.breakdown.subtotal).toBeCloseTo(19.40, 2);
    });
  });
});
