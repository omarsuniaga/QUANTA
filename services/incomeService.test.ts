import { incomeService } from './incomeService';
import { storageService } from './storageService';
import { db, auth } from '../firebaseConfig';
import { IncomeFixedTemplate, IncomeMonthlyDocument } from '../types';

// Mock dependencies
jest.mock('../firebaseConfig', () => ({
  auth: { currentUser: { uid: 'test-user' } },
  db: {
    collection: jest.fn(),
  }
}));

jest.mock('./storageService', () => ({
  storageService: {
    getTransactions: jest.fn(),
  }
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    clear: () => { store = {}; }
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('IncomeService', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('initializeMonth', () => {
    it('should create new monthly document from templates if not exists', async () => {
      // Mock Templates
      const templates: IncomeFixedTemplate[] = [
        { id: 't1', name: 'Salary', defaultAmount: 1000, active: true, frequency: 'monthly', createdAt: 0, updatedAt: 0 },
        { id: 't2', name: 'Side Gig', defaultAmount: 500, active: false, frequency: 'monthly', createdAt: 0, updatedAt: 0 }
      ];
      
      // Inject templates into LS for simplicity (service checks LS)
      localStorageMock.setItem('quanta_income_templates', JSON.stringify(templates));
      
      // Mock DB to return empty (doc not exists)
      const mockDoc = { exists: false, data: () => null };
      const mockGet = jest.fn().mockResolvedValue(mockDoc);
      const mockDocRef = { get: mockGet, set: jest.fn() };
      const mockCollection = { doc: jest.fn().mockReturnValue(mockDocRef) };
      (db!.collection as jest.Mock).mockReturnValue({ doc: () => ({ collection: () => mockCollection }) });

      const period = '2025-01';
      const doc = await incomeService.initializeMonth(period);

      expect(doc.period).toBe(period);
      expect(doc.fixedItems).toHaveLength(1); // Only active template
      expect(doc.fixedItems[0].nameSnapshot).toBe('Salary');
      expect(doc.fixedItems[0].amount).toBe(1000);
      expect(doc.fixedItems[0].status).toBe('pending');
    });

    it('should return existing document if exists', async () => {
      const existingDoc: IncomeMonthlyDocument = {
        period: '2025-01',
        fixedItems: [{ id: 'i1', templateId: 't1', nameSnapshot: 'Old', amount: 999, status: 'received', receivedAt: 123 }],
        extras: [],
        initializedFromTemplatesAt: 100
      };
      
      // Mock DB to return existing
      const mockDoc = { exists: true, data: () => existingDoc };
      const mockGet = jest.fn().mockResolvedValue(mockDoc);
      const mockDocRef = { get: mockGet };
      const mockCollection = { doc: jest.fn().mockReturnValue(mockDocRef) };
      (db!.collection as jest.Mock).mockReturnValue({ doc: () => ({ collection: () => mockCollection }) });

      const doc = await incomeService.initializeMonth('2025-01');
      expect(doc.fixedItems[0].nameSnapshot).toBe('Old');
      expect(doc.fixedItems[0].status).toBe('received');
    });
  });

  describe('toggleFixedIncomeStatus', () => {
    it('should toggle status and update receivedAt', async () => {
      const existingDoc: IncomeMonthlyDocument = {
        period: '2025-01',
        fixedItems: [{ id: 'i1', templateId: 't1', nameSnapshot: 'Salary', amount: 1000, status: 'pending', receivedAt: null }],
        extras: [],
        initializedFromTemplatesAt: 100
      };
      
      localStorageMock.setItem('quanta_income_monthly_2025-01', JSON.stringify(existingDoc));
      
      // Mock save to avoid errors
      const mockSet = jest.fn();
      const mockDocRef = { get: jest.fn(), set: mockSet };
      const mockCollection = { doc: jest.fn().mockReturnValue(mockDocRef) };
      (db!.collection as jest.Mock).mockReturnValue({ doc: () => ({ collection: () => mockCollection }) });

      await incomeService.toggleFixedIncomeStatus('2025-01', 'i1', 'received');
      
      const updated = JSON.parse(localStorageMock.getItem('quanta_income_monthly_2025-01')!);
      expect(updated.fixedItems[0].status).toBe('received');
      expect(updated.fixedItems[0].receivedAt).not.toBeNull();
    });
  });
});
