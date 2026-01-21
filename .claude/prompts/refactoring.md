# Refactoring Prompt Template

Use this template when refactoring code in QUANTA.

## Refactoring Request

**Target Code**: [File paths or component names]

**Reason for Refactoring**:
- [ ] Code duplication (DRY violation)
- [ ] Function too long (> 50 lines)
- [ ] Too complex (high cyclomatic complexity)
- [ ] Hard to test
- [ ] Performance issues
- [ ] Poor naming/unclear intent
- [ ] Pattern violation
- [ ] Other: [Specify]

## Current State Analysis

### Current Code Structure
```typescript
// Describe or paste current implementation
```

### Problems Identified
1. [Problem 1]
2. [Problem 2]
3. [Problem 3]

### Impact Assessment
- **Complexity**: [Low/Medium/High]
- **Risk**: [Low/Medium/High]
- **Files Affected**: [Count]
- **Tests Needed**: [Count]

## Refactoring Strategy

### Approach
- [ ] Extract Function
- [ ] Extract Hook
- [ ] Extract Service
- [ ] Rename for Clarity
- [ ] Simplify Logic
- [ ] Optimize Performance
- [ ] Apply Design Pattern
- [ ] Other: [Specify]

### Proposed Structure
```typescript
// Describe or show proposed implementation
```

### Benefits
1. [Benefit 1]
2. [Benefit 2]
3. [Benefit 3]

### Risks
1. [Risk 1 and mitigation]
2. [Risk 2 and mitigation]

## Implementation Plan

### Phase 1: Preparation
- [ ] Review current code and dependencies
- [ ] Identify all usages
- [ ] Plan backward compatibility (if needed)
- [ ] Create feature branch

### Phase 2: Refactoring
- [ ] Implement new structure
- [ ] Maintain existing functionality
- [ ] Update tests
- [ ] Run test suite (all must pass)

### Phase 3: Migration
- [ ] Update all call sites
- [ ] Remove old code
- [ ] Update documentation
- [ ] Verify no regressions

### Phase 4: Validation
- [ ] Code review
- [ ] Performance testing
- [ ] Manual QA
- [ ] Deploy to staging

## Common Refactoring Patterns

### Extract Function
```typescript
// BEFORE
function processTransaction(tx: Transaction) {
  const amount = tx.amount * (tx.currency === 'USD' ? rate : 1);
  if (tx.type === 'income') return amount;
  else return -amount;
}

// AFTER
function convertCurrency(amount: number, currency: string): number {
  return amount * (currency === 'USD' ? rate : 1);
}

function processTransaction(tx: Transaction) {
  const amount = convertCurrency(tx.amount, tx.currency);
  return tx.type === 'income' ? amount : -amount;
}
```

### Extract Hook
```typescript
// BEFORE - Logic in component
function Component() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchData().then(setData).finally(() => setLoading(false));
  }, []);

  // ... more logic
}

// AFTER - Logic in hook
function useData() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchData().then(setData).finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

function Component() {
  const { data, loading } = useData();
  // Component simplified
}
```

### Extract Service
```typescript
// BEFORE - Business logic in hook
function useTransactions() {
  const calculate = () => {
    // Complex calculation logic (30 lines)
  };
}

// AFTER - Business logic in service
// services/calculationService.ts
export const calculationService = {
  calculateTotal(transactions: Transaction[]): number {
    // Complex calculation logic (30 lines)
  }
};

// hooks/useTransactions.ts
function useTransactions() {
  const total = calculationService.calculateTotal(transactions);
}
```

### Simplify Conditionals
```typescript
// BEFORE
function getStatus(user: User) {
  if (user.isPremium) {
    if (user.isActive) {
      return 'premium-active';
    } else {
      return 'premium-inactive';
    }
  } else {
    if (user.isActive) {
      return 'free-active';
    } else {
      return 'free-inactive';
    }
  }
}

// AFTER
function getStatus(user: User) {
  const tier = user.isPremium ? 'premium' : 'free';
  const status = user.isActive ? 'active' : 'inactive';
  return `${tier}-${status}`;
}
```

## Testing Strategy

### Before Refactoring
```bash
# Capture current behavior
npm test -- --coverage

# Document current test results
# All tests should pass before refactoring
```

### After Refactoring
```bash
# Verify same behavior
npm test -- --coverage

# Coverage should be same or better
# All existing tests should still pass
```

### Regression Tests
- [ ] Add tests for edge cases discovered
- [ ] Ensure refactored code maintains same API
- [ ] Test error handling
- [ ] Test performance (if relevant)

## Documentation Updates

### Code Comments
- [ ] Update JSDoc if API changed
- [ ] Add comments explaining complex logic
- [ ] Remove outdated comments

### README
- [ ] Update usage examples if API changed
- [ ] Document breaking changes (if any)
- [ ] Add migration guide (if needed)

## Rollback Plan

If refactoring causes issues:
1. Revert commit: `git revert <commit-hash>`
2. Identify what broke
3. Fix and re-test
4. Re-deploy

## Success Criteria

- [ ] All tests passing
- [ ] No performance regression
- [ ] Code more readable
- [ ] Complexity reduced
- [ ] No breaking changes (or documented)
- [ ] Documentation updated
- [ ] Code review approved

## Examples from QUANTA

### Example 1: Extract Calculation to Service
**Before**: Calculation in component
**After**: Pure function in `utils/financialMathCore.ts`
**Benefit**: Testable, reusable, clear

### Example 2: Extract Logic to Hook
**Before**: useEffect and state management in multiple components
**After**: `useTransactionHandlers` hook
**Benefit**: DRY, consistent behavior

### Example 3: Simplify Service
**Before**: One service with 20 methods
**After**: Split into specific services (expenseService, incomeService)
**Benefit**: Single responsibility, easier to maintain
