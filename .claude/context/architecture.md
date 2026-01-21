# QUANTA Architecture

## System Overview

QUANTA follows a **layered architecture** pattern with clear separation of concerns. The application is built as a Progressive Web App (PWA) using React, TypeScript, Firebase, and Gemini AI.

## Architecture Layers

### 1. Presentation Layer
**Location**: `components/`

- **Base Components** (`components/base/`): Reusable UI building blocks
  - PageHeader, StatsCard, ActionButton, SectionHeader
- **Layout Components** (`components/layout/`): Application structure
  - AppLayout, BottomNavigation, DesktopSidebar, MobileHeader
- **Screen Components**: Feature-specific screens
  - Dashboard, ExpensesScreen, IncomeScreen, BudgetsScreen, etc.

**Responsibilities**:
- Render UI
- Handle user interactions
- Display data from contexts/hooks
- NO business logic

### 2. State Management Layer
**Location**: `contexts/`

**Providers**:
- `AuthContext`: User authentication state
- `TransactionsContext`: Transactions, budgets, goals
- `SettingsContext`: User preferences, currency
- `ToastContext`: Notification system
- `I18nContext`: Internationalization

**Pattern**: Observer pattern with Firebase real-time subscriptions

**Responsibilities**:
- Manage global state
- Subscribe to Firestore updates
- Provide data to components
- NO business logic (use services)

### 3. Custom Hooks Layer
**Location**: `hooks/`

**Purpose**: Extract reusable component logic

**Examples**:
- `useTransactionHandlers`: CRUD operations for transactions
- `useModalManager`: Modal state management
- `useAppNavigation`: Navigation with swipe gestures
- `useBudgetPeriod`: Budget period calculations

**Responsibilities**:
- Compose contexts and services
- Handle side effects
- Manage component-specific state
- Provide clean API to components

### 4. Business Logic Layer
**Location**: `services/`

**Core Services**:
- `storageService`: Firestore facade (Repository pattern)
- `aiGateway`: AI client singleton
- `aiCoachService`: AI-powered financial analysis
- `expenseService`, `incomeService`: Recurring transaction logic

**Responsibilities**:
- Business rules and logic
- External API integration
- Data transformation
- NO UI concerns

### 5. Utilities Layer
**Location**: `utils/`

**Pure Functions Only**:
- `financialMathCore`: Financial calculations
- `dateUtils`: Date manipulation
- `formatters`: Data formatting
- `validation`: Input validation

**Responsibilities**:
- Stateless computations
- Reusable pure functions
- NO side effects

## Design Patterns

### Singleton Pattern
**Where**: `services/aiGateway.ts`

**Purpose**: Single instance of Gemini AI client

```typescript
let geminiClient: GoogleGenerativeAI | null = null;

export const aiGateway = {
  getClient(apiKey: string) {
    if (!geminiClient) {
      geminiClient = new GoogleGenerativeAI(apiKey);
    }
    return geminiClient;
  }
};
```

### Facade Pattern
**Where**: `services/storageService.ts`

**Purpose**: Simplify Firestore API

```typescript
// Simple facade
export const storageService = {
  async getTransactions(userId: string) {
    // Complex Firestore logic hidden
  }
};
```

### Repository Pattern
**Where**: `services/storageService.ts`

**Purpose**: Abstract data access

**Benefits**:
- Decouples business logic from database
- Easy to mock for testing
- Can swap Firebase for another backend

### Observer Pattern
**Where**: Contexts + Firebase subscriptions

**Purpose**: Real-time updates

```typescript
storageService.subscribeToTransactions(userId, (data) => {
  setTransactions(data); // Observers notified
});
```

### Strategy Pattern
**Where**: AI model selection

**Purpose**: Choose algorithm at runtime

```typescript
function selectModel(priority: 'fast' | 'quality') {
  if (priority === 'fast') return 'gemini-1.5-flash-8b';
  if (priority === 'quality') return 'gemini-1.5-pro';
}
```

## Data Flow

### Read Flow (Display Data)
```
Firestore → StorageService → Context → Hook → Component → UI
```

### Write Flow (User Action)
```
UI → Component → Hook → Service → StorageService → Firestore
```

### AI Flow (Analysis)
```
Component → Hook → aiCoachService → aiGateway → Gemini API
                         ↓
                      Cache ← localStorage
```

## Security Architecture

### User Isolation
**Rule**: ALL data operations must include userId

```typescript
// ✅ GOOD
await storageService.getTransactions(user.uid);

// ❌ BAD
await storageService.getAllTransactions();
```

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null
                        && request.auth.uid == userId;
    }
  }
}
```

### Client-Side Validation
- Validate ALL user input before sending to Firestore
- Use TypeScript for type safety
- Sanitize strings to prevent injection

## Performance Architecture

### Code Splitting
**Where**: Vite config

```typescript
manualChunks: {
  vendor: ['react', 'react-dom'],
  ui: ['lucide-react'],
  charts: ['recharts']
}
```

### Lazy Loading
**Where**: Route components

```typescript
const Dashboard = lazy(() => import('./components/Dashboard'));
```

### Caching Strategy
**AI Service**: Multi-level cache (memory + localStorage)

```typescript
// Check memory cache
if (memoryCache.has(key)) return memoryCache.get(key);

// Check localStorage
const cached = localStorage.getItem(key);
if (cached) return JSON.parse(cached);

// Make API call and cache
```

## Deployment Architecture

### Build Process
```
Source Code → TypeScript Compiler → Vite Build → Terser Minification → dist/
```

### Hosting
- **Platform**: Firebase Hosting
- **CDN**: Firebase CDN (global)
- **HTTPS**: Automatic
- **Custom Domain**: Supported

### PWA
- **Service Worker**: Workbox auto-generated
- **Offline**: Full offline support
- **Caching**: CacheFirst for assets, NetworkFirst for API
- **Updates**: Automatic with user notification

## Scalability Considerations

### Current Scale
- **Users**: 100-1,000
- **Transactions/User**: 1,000-10,000
- **Read/Write**: Real-time

### Future Scaling
1. **Database**: Pagination for large lists
2. **Frontend**: Virtual scrolling
3. **AI**: Queue system for rate limiting
4. **Caching**: Redis for distributed cache

## Architectural Decisions

### Why React?
- Component-based architecture
- Large ecosystem
- Strong TypeScript support
- Excellent for PWAs

### Why Firebase?
- Real-time capabilities
- Built-in authentication
- Scalable NoSQL database
- Simple deployment

### Why Gemini AI?
- Cost-effective
- Good quality
- Fast response times
- JSON mode support

### Why Vite?
- Fast dev server (HMR)
- Excellent build performance
- Native ESM support
- Great plugin ecosystem

## Future Architecture Considerations

### Potential Improvements
1. **State Management**: Consider Zustand if Context becomes complex
2. **Backend**: Add Cloud Functions for server-side operations
3. **Testing**: Add E2E tests with Playwright
4. **Monitoring**: Add Sentry for error tracking
5. **Analytics**: Firebase Analytics integration

### Migration Paths
- **Database**: If outgrowing Firestore → PostgreSQL + Supabase
- **AI**: If needing multiple providers → Unified AI service layer
- **Deployment**: If needing more control → Vercel or Netlify
