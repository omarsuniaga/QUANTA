# Feature Development Prompt Template

Use this template when implementing new features in QUANTA.

## Feature Specification

**Feature Name**: [Name of the feature]

**User Story**: As a [user type], I want to [action] so that [benefit]

**Acceptance Criteria**:
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

## Architecture Design

### Data Model
```typescript
interface FeatureData {
  id: string;
  // Define your data structure
}
```

### Component Structure
```
components/
  └── FeatureScreen.tsx        # Main screen component
hooks/
  └── useFeature.ts            # Feature-specific hook
services/
  └── featureService.ts        # Business logic
types.ts                       # Add FeatureData interface
```

### Data Flow
```
User Interaction → Component → Hook → Service → StorageService → Firestore
                                               ↓
                                          AI Service (if needed)
```

## Implementation Plan

### Phase 1: Backend/Logic
1. [ ] Define TypeScript interfaces in `types.ts`
2. [ ] Create service in `services/featureService.ts`
3. [ ] Add storage methods to `storageService.ts`
4. [ ] Create custom hook in `hooks/useFeature.ts`
5. [ ] Write unit tests for service

### Phase 2: UI
6. [ ] Design component structure
7. [ ] Implement UI component
8. [ ] Connect hook to component
9. [ ] Add loading and error states
10. [ ] Ensure responsive design

### Phase 3: Integration
11. [ ] Add to navigation/routing
12. [ ] Integrate with existing contexts
13. [ ] Test user flow end-to-end
14. [ ] Add accessibility features

### Phase 4: Polish
15. [ ] Write component tests
16. [ ] Add JSDoc documentation
17. [ ] Request code review
18. [ ] Address feedback
19. [ ] Deploy

## Code Templates

### Service Template
```typescript
// services/featureService.ts
import { storageService } from './storageService';
import type { FeatureData } from '../types';

export const featureService = {
  async create(userId: string, data: Omit<FeatureData, 'id'>): Promise<FeatureData> {
    // Validation
    if (!userId) throw new Error('User ID required');

    // Create entity
    const feature: FeatureData = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: Date.now()
    };

    // Persist
    await storageService.addFeature(userId, feature);

    return feature;
  },

  // Add more methods
};
```

### Hook Template
```typescript
// hooks/useFeature.ts
import { useState, useCallback } from 'react';
import { featureService } from '../services/featureService';
import { useAuth } from './useAuth';

export const useFeature = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createFeature = useCallback(async (data: FeatureData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await featureService.create(user!.uid, data);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    loading,
    error,
    createFeature
  };
};
```

### Component Template
```typescript
// components/FeatureScreen.tsx
import { useFeature } from '../hooks/useFeature';

export function FeatureScreen() {
  const { loading, error, createFeature } = useFeature();

  const handleSubmit = async (data: FeatureData) => {
    try {
      await createFeature(data);
      // Success handling
    } catch (error) {
      // Error handling
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {/* Your UI */}
    </div>
  );
}
```

## Testing Strategy

### Unit Tests
```typescript
// services/featureService.test.ts
describe('featureService', () => {
  it('creates feature successfully', async () => {
    const feature = await featureService.create(userId, data);
    expect(feature).toHaveProperty('id');
  });

  it('throws error for invalid data', async () => {
    await expect(
      featureService.create(userId, invalidData)
    ).rejects.toThrow();
  });
});
```

### Component Tests
```typescript
// components/FeatureScreen.test.tsx
describe('FeatureScreen', () => {
  it('renders correctly', () => {
    render(<FeatureScreen />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles submission', async () => {
    const user = userEvent.setup();
    render(<FeatureScreen />);

    await user.click(screen.getByRole('button', { name: /submit/i }));

    // Assert expected behavior
  });
});
```

## Documentation

### JSDoc for Service
```typescript
/**
 * Feature Service
 *
 * Handles [feature] operations including [what it does].
 *
 * @module services/featureService
 */
```

### README Section
```markdown
## Feature Name

### Overview
Brief description of what this feature does.

### Usage
\`\`\`typescript
const { createFeature } = useFeature();
await createFeature(data);
\`\`\`

### API
- `createFeature(data)`: Creates a new feature item
```

## Handoff Checklist

Before marking feature complete:
- [ ] All acceptance criteria met
- [ ] Code reviewed and approved
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Accessible (keyboard nav, screen readers)
- [ ] Responsive (mobile, tablet, desktop)
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Ready for deployment
