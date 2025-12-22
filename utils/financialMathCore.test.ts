
import { 
  calculateSavingsRate, 
  calculateRunway, 
  calculateDTI, 
  calculateBurnRate,
  calculateDailyIncome,
  calculateDistributionCompatibility
} from './financialMathCore';

describe('Financial Math Core', () => {
  
  describe('Savings Rate', () => {
    it('should calculate correct savings rate', () => {
      // Input(Income: 1000, Expenses: 800) -> Output: 20%.
      expect(calculateSavingsRate(1000, 800)).toBe(20);
    });

    it('should handle zero income (prevent division by zero)', () => {
      expect(calculateSavingsRate(0, 800)).toBe(0);
    });
    
     it('should handle negative savings (expenses > income)', () => {
      expect(calculateSavingsRate(1000, 1200)).toBe(-20);
    });
  });

  describe('Runway', () => {
    it('should calculate correct runway months', () => {
      // Input(Balance: 5000, MonthlyExpenses: 1000) -> Output: 5.
      expect(calculateRunway(5000, 1000)).toBe(5);
    });

    it('should handle zero monthly expenses (infinite runway)', () => {
       expect(calculateRunway(5000, 0)).toBe(999);
    });
  });

  describe('Debt-to-Income (DTI)', () => {
    it('should calculate correct DTI', () => {
      // Input(DebtPayments: 400, TotalIncome: 1000) -> Output: 40%.
      expect(calculateDTI(400, 1000)).toBe(40);
    });

    it('should handle zero income', () => {
      expect(calculateDTI(400, 0)).toBe(0);
    });
  });

  describe('Burn Rate', () => {
    it('should calculate daily burn rate correctly', () => {
      // Mock transactions
      const transactions: any[] = [
        { type: 'expense', amount: 300, date: new Date().toISOString() },
        { type: 'expense', amount: 600, date: new Date().toISOString() },
        { type: 'income', amount: 5000, date: new Date().toISOString() } // Should be ignored
      ];
      // Total expenses = 900. Days lookback = 30. Daily burn = 30.
      expect(calculateBurnRate(transactions, 30)).toBe(30);
    });

    it('should handle empty transactions', () => {
      expect(calculateBurnRate([], 30)).toBe(0);
    });
  });

  describe('Daily Income', () => {
    it('should calculate daily income correctly', () => {
       const transactions: any[] = [
        { type: 'income', amount: 3000, date: new Date().toISOString() }, // 100/day for 30 days
      ];
      expect(calculateDailyIncome(transactions, 30)).toBe(100);
    });

    it('should handle zero income', () => {
      expect(calculateDailyIncome([], 30)).toBe(0);
    });
  });

   describe('Distribution Compatibility', () => {
    it('should return 100 for perfect match', () => {
      expect(calculateDistributionCompatibility([50, 30, 20], [50, 30, 20])).toBe(100);
    });

     it('should return lower score for mismatch', () => {
      // 50 vs 0 -> 50 diff
      // 30 vs 0 -> 30 diff
      // 20 vs 100 -> 80 diff
      // Avg diff = (50+30+80)/3 = 53.33
      // Score = 100 - 53.33 = 46.66 -> 47
      expect(calculateDistributionCompatibility([0, 0, 100], [50, 30, 20])).toBeLessThan(50);
    });
  });

});
