import { describe, it, expect } from 'vitest';
import { calculatePlanAllocations, PLAN_DEFINITIONS } from './surplusPlan';

describe('calculatePlanAllocations', () => {
  describe('Conservative Plan (70/20/10)', () => {
    it('should calculate correct allocations for RD$ 10,000', () => {
      const result = calculatePlanAllocations(10000, 'conservative');
      
      expect(result.savings).toBe(7000);
      expect(result.goals).toBe(2000);
      expect(result.personal).toBe(1000);
      
      // Verify exact sum
      const sum = result.savings + result.goals + result.personal;
      expect(sum).toBe(10000);
    });

    it('should handle real case: RD$ 42,436.80', () => {
      const available = 42436.80;
      const result = calculatePlanAllocations(available, 'conservative');
      
      // Conservative: 70% savings, 20% goals, 10% personal
      expect(result.savings).toBe(29705.76); // 42436.80 * 0.7 = 29705.76
      expect(result.goals).toBe(8487.36);    // 42436.80 * 0.2 = 8487.36
      expect(result.personal).toBe(4243.68); // Residual
      
      // Critical: verify exact sum (allow tiny floating point error)
      const sum = result.savings + result.goals + result.personal;
      expect(sum).toBeCloseTo(available, 2);
    });

    it('should handle odd decimal: RD$ 100.01', () => {
      const available = 100.01;
      const result = calculatePlanAllocations(available, 'conservative');
      
      expect(result.savings).toBe(70.01);  // round(100.01 * 0.7 * 100) / 100
      expect(result.goals).toBe(20.00);    // round(100.01 * 0.2 * 100) / 100
      expect(result.personal).toBe(10.00); // 100.01 - 70.01 - 20.00
      
      const sum = result.savings + result.goals + result.personal;
      expect(sum).toBe(available);
    });

    it('should handle tiny amount: RD$ 0.03', () => {
      const available = 0.03;
      const result = calculatePlanAllocations(available, 'conservative');
      
      // With such small amounts, rounding matters
      expect(result.savings).toBe(0.02);  // round(0.03 * 0.7 * 100) / 100 = round(2.1) / 100 = 0.02
      expect(result.goals).toBe(0.01);    // round(0.03 * 0.2 * 100) / 100 = round(0.6) / 100 = 0.01
      expect(Math.abs(result.personal)).toBeLessThanOrEqual(0.01); // Close to 0
      
      const sum = result.savings + result.goals + result.personal;
      expect(sum).toBeCloseTo(available, 2);
    });
  });

  describe('Balanced Plan (50/30/20)', () => {
    it('should calculate correct allocations for RD$ 15,000', () => {
      const result = calculatePlanAllocations(15000, 'balanced');
      
      expect(result.savings).toBe(7500);
      expect(result.goals).toBe(4500);
      expect(result.personal).toBe(3000);
      
      const sum = result.savings + result.goals + result.personal;
      expect(sum).toBe(15000);
    });

    it('should handle real case: RD$ 42,436.80', () => {
      const available = 42436.80;
      const result = calculatePlanAllocations(available, 'balanced');
      
      // Balanced: 50% savings, 30% goals, 20% personal
      expect(result.savings).toBe(21218.40);  // 42436.80 * 0.5
      expect(result.goals).toBe(12731.04);    // 42436.80 * 0.3
      expect(result.personal).toBe(8487.36);  // Residual
      
      const sum = result.savings + result.goals + result.personal;
      expect(sum).toBe(available);
    });

    it('should handle decimal edge case: RD$ 99.99', () => {
      const available = 99.99;
      const result = calculatePlanAllocations(available, 'balanced');
      
      expect(result.savings).toBe(50.00);
      expect(result.goals).toBe(30.00);
      expect(result.personal).toBe(19.99); // Absorbs residual
      
      const sum = result.savings + result.goals + result.personal;
      expect(sum).toBe(available);
    });
  });

  describe('Aggressive Plan (30/40/30)', () => {
    it('should calculate correct allocations for RD$ 10,000', () => {
      const result = calculatePlanAllocations(10000, 'aggressive');
      
      expect(result.savings).toBe(3000);
      expect(result.goals).toBe(4000);
      expect(result.personal).toBe(3000);
      
      const sum = result.savings + result.goals + result.personal;
      expect(sum).toBe(10000);
    });

    it('should handle real case: RD$ 42,436.80', () => {
      const available = 42436.80;
      const result = calculatePlanAllocations(available, 'aggressive');
      
      // Aggressive: 30% savings, 40% goals, 30% personal
      expect(result.savings).toBe(12731.04);  // 42436.80 * 0.3
      expect(result.goals).toBe(16974.72);    // 42436.80 * 0.4
      expect(result.personal).toBe(12731.04); // Residual
      
      const sum = result.savings + result.goals + result.personal;
      expect(sum).toBe(available);
    });

    it('should handle fractional cents: RD$ 1234.56', () => {
      const available = 1234.56;
      const result = calculatePlanAllocations(available, 'aggressive');
      
      expect(result.savings).toBe(370.37);   // round(1234.56 * 0.3 * 100) / 100
      expect(result.goals).toBe(493.82);     // round(1234.56 * 0.4 * 100) / 100
      expect(result.personal).toBe(370.37);  // 1234.56 - 370.37 - 493.82
      
      const sum = result.savings + result.goals + result.personal;
      expect(sum).toBe(available);
    });
  });

  describe('Edge Cases', () => {
    it('should return zeros when available is 0', () => {
      const result = calculatePlanAllocations(0, 'conservative');
      
      expect(result.savings).toBe(0);
      expect(result.goals).toBe(0);
      expect(result.personal).toBe(0);
    });

    it('should return zeros when available is negative', () => {
      const result = calculatePlanAllocations(-1000, 'balanced');
      
      expect(result.savings).toBe(0);
      expect(result.goals).toBe(0);
      expect(result.personal).toBe(0);
    });

    it('CRITICAL: should NEVER return negative values under any circumstances', () => {
      // Test exhaustively with edge cases that could cause negative residuals
      const edgeCases = [
        -1000, -0.01, 0, 0.01, 0.03, 0.99, 1.00, 1.01,
        99.99, 100.00, 100.01, 999.99, 1000.00,
        42436.80, 87563.20, 100000.00
      ];
      
      const plans: PlanId[] = ['conservative', 'balanced', 'aggressive'];
      
      edgeCases.forEach(amount => {
        plans.forEach(plan => {
          const result = calculatePlanAllocations(amount, plan);
          
          // CRITICAL: No value should ever be negative
          expect(result.savings).toBeGreaterThanOrEqual(0);
          expect(result.goals).toBeGreaterThanOrEqual(0);
          expect(result.personal).toBeGreaterThanOrEqual(0);
          
          // Additional check: no NaN values
          expect(Number.isFinite(result.savings)).toBe(true);
          expect(Number.isFinite(result.goals)).toBe(true);
          expect(Number.isFinite(result.personal)).toBe(true);
        });
      });
    });

    it('CRITICAL: should guarantee EXACT sum to the cent (no drift)', () => {
      // Test with amounts that are prone to floating point errors
      const criticalAmounts = [
        { amount: 42436.80, name: 'Real case 1' },
        { amount: 87563.20, name: 'Real case 2' },
        { amount: 0.03, name: 'Tiny amount' },
        { amount: 100.01, name: 'Odd decimal' },
        { amount: 999.99, name: 'All nines' },
        { amount: 1234.56, name: 'Random decimal' },
        { amount: 9999.99, name: 'Large nines' },
        { amount: 12345.67, name: 'Random large' }
      ];
      
      const plans: PlanId[] = ['conservative', 'balanced', 'aggressive'];
      
      criticalAmounts.forEach(({ amount, name }) => {
        plans.forEach(plan => {
          const result = calculatePlanAllocations(amount, plan);
          const sum = result.savings + result.goals + result.personal;
          
          // For positive amounts, sum must be within 1 cent precision
          if (amount > 0) {
            const diff = Math.abs(sum - amount);
            expect(diff).toBeLessThanOrEqual(0.01);
            
            // Log failures for debugging
            if (diff > 0.01) {
              console.error(`DRIFT DETECTED for ${name} (${amount}) with ${plan}:`, {
                expected: amount,
                actual: sum,
                diff,
                breakdown: result
              });
            }
          }
        });
      });
    });

    it('should handle very large amounts: RD$ 1,000,000', () => {
      const available = 1000000;
      const result = calculatePlanAllocations(available, 'balanced');
      
      expect(result.savings).toBe(500000);
      expect(result.goals).toBe(300000);
      expect(result.personal).toBe(200000);
      
      const sum = result.savings + result.goals + result.personal;
      expect(sum).toBe(available);
    });

    it('should never produce negative values', () => {
      const testCases = [0.01, 0.10, 1.00, 10.00, 100.00, 1000.00, 42436.80];
      const plans = ['conservative', 'balanced', 'aggressive'] as const;
      
      testCases.forEach(amount => {
        plans.forEach(plan => {
          const result = calculatePlanAllocations(amount, plan);
          
          expect(result.savings).toBeGreaterThanOrEqual(0);
          expect(result.goals).toBeGreaterThanOrEqual(0);
          expect(result.personal).toBeGreaterThanOrEqual(0);
        });
      });
    });

    it('should always sum to exactly available (no drift)', () => {
      // Test multiple random-like amounts to ensure no floating point drift
      const testAmounts = [
        42436.80,
        9999.99,
        100.01,
        0.03,
        12345.67,
        87563.20,
        1.11,
        99.99,
        1234.56
      ];
      
      testAmounts.forEach(amount => {
        ['conservative', 'balanced', 'aggressive'].forEach(plan => {
          const result = calculatePlanAllocations(amount, plan as any);
          const sum = result.savings + result.goals + result.personal;
          
          // Must be close to equal (within 2 decimal places precision)
          expect(sum).toBeCloseTo(amount, 2);
        });
      });
    });

    it('should round to 2 decimal places', () => {
      const result = calculatePlanAllocations(100.999, 'conservative');
      
      // All values should have max 2 decimal places
      expect(Number.isInteger(result.savings * 100)).toBe(true);
      expect(Number.isInteger(result.goals * 100)).toBe(true);
      expect(Number.isInteger(result.personal * 100)).toBe(true);
    });
  });

  describe('Plan Definitions Integrity', () => {
    it('should have all plans defined', () => {
      expect(PLAN_DEFINITIONS.conservative).toBeDefined();
      expect(PLAN_DEFINITIONS.balanced).toBeDefined();
      expect(PLAN_DEFINITIONS.aggressive).toBeDefined();
    });

    it('conservative plan percentages should sum to 1.0', () => {
      const plan = PLAN_DEFINITIONS.conservative.percentages;
      const sum = plan.savings + plan.goals + plan.personal;
      expect(sum).toBeCloseTo(1.0, 10);
    });

    it('balanced plan percentages should sum to 1.0', () => {
      const plan = PLAN_DEFINITIONS.balanced.percentages;
      const sum = plan.savings + plan.goals + plan.personal;
      expect(sum).toBeCloseTo(1.0, 10);
    });

    it('aggressive plan percentages should sum to 1.0', () => {
      const plan = PLAN_DEFINITIONS.aggressive.percentages;
      const sum = plan.savings + plan.goals + plan.personal;
      expect(sum).toBeCloseTo(1.0, 10);
    });
  });
});
