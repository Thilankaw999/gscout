import { InvoiceService } from './invoice.service';

describe('ContactService', () => {
  let service: InvoiceService;

  beforeEach(() => {
    service = new InvoiceService();
  });

  describe('calculateClaimAmount', () => {
    describe('price validation', () => {
      it('should return 0 when price is undefined', () => {
        expect(service.calculateClaimAmount({ units: 2 }, undefined)).toBe(0);
      });

      it('should return 0 when price is NaN', () => {
        expect(service.calculateClaimAmount({ units: 2 }, NaN)).toBe(0);
      });

      it('should return 0 when price is null', () => {
        expect(service.calculateClaimAmount({ units: 2 }, null)).toBe(0);
      });
    });

    describe('units calculations', () => {
      it('should calculate correct amount with valid units and price', () => {
        expect(service.calculateClaimAmount({ units: 2 }, 10)).toBe(20.0);
        expect(service.calculateClaimAmount({ units: 1.5 }, 10)).toBe(15.0);
        expect(service.calculateClaimAmount({ units: 0 }, 10)).toBe(0.0);
      });

      it('should handle decimal precision correctly', () => {
        expect(service.calculateClaimAmount({ units: 2 }, 10.55)).toBe(21.1);
        expect(service.calculateClaimAmount({ units: 1.5 }, 3.33)).toBe(5.0);
      });

      it('should return 0 for invalid units', () => {
        expect(service.calculateClaimAmount({ units: NaN }, 10)).toBe(0);
        expect(service.calculateClaimAmount({ units: undefined }, 10)).toBe(0);
        expect(service.calculateClaimAmount({ units: null }, 10)).toBe(0);
      });
    });

    describe('duration calculations', () => {
      it('should calculate correct amount with valid duration and price', () => {
        expect(service.calculateClaimAmount({ duration: '1:00' }, 10)).toBe(
          10.0,
        );
        expect(service.calculateClaimAmount({ duration: '1:30' }, 10)).toBe(
          15.0,
        );
        expect(service.calculateClaimAmount({ duration: '0:30' }, 10)).toBe(
          5.0,
        );
      });

      it('should handle various duration formats', () => {
        expect(service.calculateClaimAmount({ duration: '2:15' }, 10)).toBe(
          22.5,
        );
        expect(service.calculateClaimAmount({ duration: '0:45' }, 10)).toBe(
          7.5,
        );
      });

      it('should return 0 for empty or missing duration', () => {
        expect(service.calculateClaimAmount({ duration: '' }, 10)).toBe(0);
        expect(service.calculateClaimAmount({ duration: undefined }, 10)).toBe(
          0,
        );
        expect(service.calculateClaimAmount({ duration: null }, 10)).toBe(0);
      });
    });

    describe('edge cases', () => {
      it('should handle empty quantity object', () => {
        expect(service.calculateClaimAmount({}, 10)).toBe(0);
      });

      it('should handle undefined quantity', () => {
        expect(service.calculateClaimAmount(undefined, 10)).toBe(0);
      });

      it('should handle null quantity', () => {
        expect(service.calculateClaimAmount(null, 10)).toBe(0);
      });

      it('should prioritize units over duration if both are present', () => {
        expect(
          service.calculateClaimAmount({ units: 2, duration: '1:00' }, 10),
        ).toBe(20.0);
      });

      it('should handle very large numbers appropriately', () => {
        expect(service.calculateClaimAmount({ units: 999999 }, 999999)).toBe(
          999998000001.0,
        );
      });

      it('should handle very small decimal numbers', () => {
        expect(service.calculateClaimAmount({ units: 0.001 }, 0.001)).toBe(0.0);
      });
    });

    describe('precision and rounding', () => {
      it('should round to 2 decimal places', () => {
        expect(service.calculateClaimAmount({ units: 1 }, 10.666)).toBe(10.67);
        expect(service.calculateClaimAmount({ units: 1 }, 10.664)).toBe(10.66);
      });

      it('should handle floating point precision issues', () => {
        expect(service.calculateClaimAmount({ units: 0.1 }, 0.2)).toBe(0.02);
        expect(service.calculateClaimAmount({ units: 1.1 }, 1.1)).toBe(1.21);
      });
    });
  });
});
