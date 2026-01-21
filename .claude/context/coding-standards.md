# QUANTA Coding Standards

## General Principles

1. **KISS** (Keep It Simple, Stupid): Simplest solution wins
2. **DRY** (Don't Repeat Yourself): Extract repeated code
3. **YAGNI** (You Aren't Gonna Need It): Don't over-engineer
4. **SOLID** Principles (especially Single Responsibility)

## TypeScript Standards

### Strict Mode
**Always enabled** in `tsconfig.json`

```typescript
// ✅ GOOD
function calculate(value: number): number {
  return value * 2;
}

// ❌ BAD
function calculate(value: any) {
  return value * 2;
}
```

### Type Definitions
```typescript
// ✅ GOOD - Explicit interface
interface User {
  id: string;
  name: string;
  email: string;
}

// ✅ GOOD - Type for unions
type Status = 'active' | 'inactive' | 'pending';

// ❌ BAD - any type
const user: any = { };
```

### Null Checks
```typescript
// ✅ GOOD
if (user) {
  console.log(user.name);
}

// ✅ GOOD - Optional chaining
console.log(user?.name);

// ❌ BAD - No null check
console.log(user.name); // May crash
```

## File Organization

### Naming Conventions
- **Components**: `PascalCase.tsx` (e.g., `Dashboard.tsx`)
- **Hooks**: `camelCase.ts` with `use` prefix (e.g., `useAuth.ts`)
- **Services**: `camelCase.ts` with `Service` suffix (e.g., `storageService.ts`)
- **Utils**: `camelCase.ts` (e.g., `dateUtils.ts`)
- **Types**: `types.ts` (one file)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`)

### File Structure
```typescript
// 1. Imports (grouped)
import { useState } from 'react'; // React
import { format } from 'date-fns'; // External
import type { Transaction } from '../types'; // Types
import { storageService } from '../services/storageService'; // Local

// 2. Types/Interfaces
interface Props {
  // ...
}

// 3. Constants
const MAX_ITEMS = 100;

// 4. Component/Function
export function Component(props: Props) {
  // ...
}

// 5. Helper functions (if any)
function helperFunction() {
  // ...
}
```

## React Standards

### Function Components Only
```typescript
// ✅ GOOD
export function Dashboard() {
  return <div>Dashboard</div>;
}

// ❌ BAD - Class components deprecated
export class Dashboard extends React.Component {
  render() {
    return <div>Dashboard</div>;
  }
}
```

### Hooks Rules
```typescript
// ✅ GOOD - Hooks at top level
function Component() {
  const [state, setState] = useState();
  const data = useData();

  if (condition) {
    return <div>Early return</div>;
  }

  return <div>{data}</div>;
}

// ❌ BAD - Conditional hooks
function Component() {
  if (condition) {
    const [state, setState] = useState(); // ❌
    return <div>Early return</div>;
  }
}
```

### Props Destructuring
```typescript
// ✅ GOOD
export function Component({ title, description }: Props) {
  return <h1>{title}</h1>;
}

// ⚪ ACCEPTABLE (if many props)
export function Component(props: Props) {
  return <h1>{props.title}</h1>;
}
```

### Event Handlers
```typescript
// ✅ GOOD - Inline for simple
<button onClick={() => setCount(count + 1)}>Click</button>

// ✅ GOOD - useCallback for complex
const handleClick = useCallback(() => {
  // complex logic
}, [dependencies]);

<button onClick={handleClick}>Click</button>
```

## Service Standards

### Service Structure
```typescript
export const featureService = {
  // CRUD operations
  async create(userId: string, data: Data): Promise<Entity> {
    // Validate
    if (!userId) throw new Error('User ID required');

    // Business logic
    const entity = { /* ... */ };

    // Persist
    await storageService.save(userId, entity);

    return entity;
  },

  // Pure calculations
  calculate(items: Item[]): number {
    return items.reduce((sum, item) => sum + item.value, 0);
  }
};
```

### Error Handling
```typescript
// ✅ GOOD - Specific errors
throw new Error('Transaction amount must be positive');

// ❌ BAD - Generic errors
throw new Error('Error');

// ✅ GOOD - Try-catch in services
try {
  await externalAPI.call();
} catch (error) {
  console.error('[serviceName]:', error);
  throw new Error(`Operation failed: ${error.message}`);
}
```

## Hook Standards

### Custom Hook Structure
```typescript
export const useFeature = () => {
  // 1. Context consumption
  const { data } = useContext(SomeContext);

  // 2. Local state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 3. Memoized values
  const computed = useMemo(() => {
    return expensiveCalc(data);
  }, [data]);

  // 4. Callbacks
  const handleAction = useCallback(async () => {
    try {
      setLoading(true);
      await service.action();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 5. Effects
  useEffect(() => {
    // Side effects
    return () => {
      // Cleanup
    };
  }, []);

  // 6. Return API
  return {
    data: computed,
    loading,
    error,
    handleAction
  };
};
```

## Performance Standards

### useMemo
```typescript
// ✅ USE for expensive calculations
const total = useMemo(() => {
  return transactions.reduce((sum, tx) => sum + tx.amount, 0);
}, [transactions]);

// ❌ DON'T USE for simple values
const fullName = useMemo(() => {
  return `${firstName} ${lastName}`; // Too simple
}, [firstName, lastName]);
```

### useCallback
```typescript
// ✅ USE for callbacks passed to children
const handleClick = useCallback(() => {
  doSomething();
}, [dependencies]);

<ChildComponent onClick={handleClick} />

// ❌ DON'T USE for event handlers not passed down
const handleClick = useCallback(() => {
  doSomething();
}, []); // Unnecessary if not passed to child

<button onClick={handleClick}>Click</button>
```

## Comment Standards

### JSDoc for Public APIs
```typescript
/**
 * Calculates the savings rate as percentage of income
 *
 * @param income - Total income amount
 * @param expenses - Total expense amount
 * @returns Savings rate (0-100)
 *
 * @example
 * ```typescript
 * const rate = calculateSavingsRate(1000, 800);
 * console.log(rate); // 20
 * ```
 */
export function calculateSavingsRate(
  income: number,
  expenses: number
): number {
  // ...
}
```

### Inline Comments
```typescript
// ✅ GOOD - Explain WHY
// Using floor to ensure whole currency units
const rounded = Math.floor(amount);

// ❌ BAD - Explain WHAT (code is self-explanatory)
// Set amount to 100
const amount = 100;
```

### TODO Comments
```typescript
// TODO: Add pagination when list > 100 items
// FIXME: Edge case when timezone crosses midnight
// HACK: Temporary workaround for API bug
```

## Testing Standards

### Test File Naming
- Same name as file being tested with `.test.ts(x)` suffix
- Example: `Dashboard.tsx` → `Dashboard.test.tsx`

### Test Structure
```typescript
describe('ComponentName', () => {
  it('renders correctly', () => {
    // Arrange
    const props = { /* */ };

    // Act
    render(<Component {...props} />);

    // Assert
    expect(screen.getByText('Expected')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    // ...
  });
});
```

### Test Coverage
- **Utils**: > 90% (pure functions, easy to test)
- **Services**: > 85%
- **Hooks**: > 85%
- **Components**: > 75%

## Git Standards

### Commit Messages
```
type(scope): subject

body (optional)

footer (optional)
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `docs`: Documentation
- `test`: Tests
- `chore`: Maintenance

**Examples**:
```
feat(expenses): add recurring expense support

fix(auth): resolve logout redirect issue

refactor(dashboard): extract calculations to service
```

### Branch Naming
```
feature/expense-recurring
fix/auth-logout-redirect
refactor/dashboard-calculations
```

## Security Standards

### Never Commit Secrets
```typescript
// ❌ NEVER
const API_KEY = 'AIza...';

// ✅ ALWAYS use environment variables
const API_KEY = import.meta.env.VITE_API_KEY;
```

### User Isolation
```typescript
// ✅ ALWAYS include userId
await storageService.getData(userId);

// ❌ NEVER fetch all data
await storageService.getAllData();
```

### Input Validation
```typescript
// ✅ ALWAYS validate
function createTransaction(data: Partial<Transaction>) {
  if (!data.amount || data.amount <= 0) {
    throw new Error('Invalid amount');
  }
  // ...
}
```

## Accessibility Standards

### Semantic HTML
```tsx
// ✅ GOOD
<button onClick={handleClick}>Click</button>
<nav><a href="/home">Home</a></nav>

// ❌ BAD
<div onClick={handleClick}>Click</div>
<div><span onClick={goHome}>Home</span></div>
```

### ARIA Labels
```tsx
<button aria-label="Close modal">
  <X className="w-6 h-6" />
</button>
```

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Tab order should be logical
- Focus states must be visible
