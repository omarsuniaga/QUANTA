---
project: QUANTA
type: Financial Management PWA
version: 1.0.0
status: Production
updated: 2026-01-20
---

# QUANTA - Project Context

## Overview

QUANTA es una Progressive Web App (PWA) de gestión financiera personal con capacidades avanzadas de IA. El proyecto cuenta con ~28,700 líneas de código, 56 componentes React, 17 servicios especializados y un sistema robusto de análisis financiero con Gemini AI.

## Tech Stack

### Core
- **React**: 19.2.1 (Framework UI)
- **TypeScript**: 5.8.2 (Type safety)
- **Vite**: 6.2.0 (Build tool & dev server)

### Backend
- **Firebase**: 12.6.0
  - Firestore (NoSQL Database)
  - Authentication
  - Hosting
  - Real-time subscriptions

### AI/ML
- **Google Generative AI**: 0.24.1
  - Gemini API SDK
  - Financial analysis
  - Coach conversacional
  - Insights automáticos

### UI Libraries
- **Lucide React**: 0.556.0 (Icons)
- **Recharts**: 3.5.1 (Charts & visualizations)
- **React Markdown**: 10.1.0 (Markdown rendering)

### Testing
- **Vitest**: 4.0.15
- **Testing Library React**: 16.3.0
- **JSDOM**: 27.3.0

### Build & PWA
- **Vite Plugin PWA**: 1.2.0
- **Workbox**: (Service workers)

### Reporting
- **jsPDF**: 3.0.4
- **jsPDF AutoTable**: 5.0.2

## Project Structure

```
QUANTA/
├── components/              # 56 React components
│   ├── base/               # Reusable base components
│   │   ├── PageHeader.tsx
│   │   ├── StatsCard.tsx
│   │   ├── SectionHeader.tsx
│   │   └── ActionButton.tsx
│   ├── layout/             # Layout components
│   │   ├── AppLayout.tsx
│   │   ├── BottomNavigation.tsx
│   │   ├── DesktopSidebar.tsx
│   │   └── MobileHeader.tsx
│   ├── modals/             # Modal system
│   │   ├── ModalRenderer.tsx
│   │   └── ScreenRenderer.tsx
│   ├── Dashboard.tsx       # Main dashboard
│   ├── IncomeScreen.tsx    # Income management
│   ├── ExpensesScreen.tsx  # Expense management
│   ├── BudgetsScreen.tsx   # Budget management
│   ├── TransactionsScreen.tsx
│   ├── AICoachScreen.tsx   # AI financial coach
│   ├── GoalsManagement.tsx
│   ├── SavingsPlanner.tsx
│   └── SettingsScreen.tsx
│
├── contexts/               # React Context API
│   ├── AuthContext.tsx
│   ├── TransactionsContext.tsx
│   ├── SettingsContext.tsx
│   ├── ToastContext.tsx
│   └── I18nContext.tsx
│
├── hooks/                  # 14 custom hooks
│   ├── useTransactionHandlers.ts
│   ├── useExpenseManager.ts
│   ├── useIncomeManager.ts
│   ├── useBudgetHandlers.ts
│   ├── useGoalHandlers.ts
│   ├── useModalManager.ts
│   ├── useScreenManager.ts
│   ├── useAppNavigation.ts
│   ├── useBudgetPeriod.ts
│   ├── useCurrency.ts
│   └── useNotificationSystem.ts
│
├── services/               # 17 business logic services
│   ├── storageService.ts        # Firebase/Firestore facade
│   ├── aiGateway.ts            # AI Gateway (Singleton)
│   ├── geminiService.ts        # Gemini API integration
│   ├── aiCoachService.ts       # AI financial coach
│   ├── apiRateLimiter.ts       # Rate limiting
│   ├── expenseService.ts       # Expense management
│   ├── incomeService.ts        # Income management
│   ├── budgetService.ts
│   ├── goalsService.ts
│   ├── notificationService.ts
│   ├── smartNotificationService.ts
│   ├── reportService.ts
│   ├── backupService.ts
│   └── loggerService.ts
│
├── utils/                  # 13 utility files
│   ├── financialMathCore.ts     # Pure financial math
│   ├── financialHealth.ts       # Health metrics
│   ├── dashboardCalculations.ts
│   ├── dateUtils.ts
│   ├── formatters.ts
│   ├── validation.ts
│   └── categoryKeywords.ts
│
├── constants/              # App constants
├── types.ts               # TypeScript definitions
├── firebaseConfig.ts      # Firebase config
├── App.tsx                # Root component
└── index.tsx              # Entry point
```

## Architecture Layers

### Layer 1: Presentation (UI)
**Location**: `components/`
- 56 React components
- Lazy loading with React.lazy
- Compound components pattern
- Responsive design (mobile-first)

### Layer 2: State Management
**Location**: `contexts/`
- React Context API
- Real-time Firebase subscriptions
- Observer pattern

### Layer 3: Business Logic
**Location**: `services/`
- 17 specialized services
- Singleton pattern (aiGateway)
- Facade pattern (storageService)
- Repository pattern

### Layer 4: Custom Hooks
**Location**: `hooks/`
- 14 custom hooks
- Reusable logic extraction
- Clean separation of concerns

### Layer 5: Utilities
**Location**: `utils/`
- Pure functions
- Financial calculations
- Date helpers
- Formatters & validators

## Design Patterns Used

### Architectural Patterns
1. **Singleton**: `aiGateway.ts` - Single instance of Gemini client
2. **Facade**: `storageService.ts` - Simplified Firestore interface
3. **Observer**: Context API + Firebase real-time listeners
4. **Strategy**: AI model selection in `geminiService.ts`
5. **Repository**: `storageService.ts` - Data access abstraction

### React Patterns
1. **Compound Components**: Modal and Screen renderers
2. **Custom Hooks**: Logic extraction and reusability
3. **Lazy Loading**: Code splitting with React.lazy
4. **Render Props**: Children as function pattern

### Optimization Patterns
1. **Code Splitting**: Vite manual chunks (vendor, ui, charts)
2. **Lazy Loading**: Route-based component loading
3. **Memoization**: useMemo in contexts for expensive calculations
4. **Cache Aside**: Multi-level caching in AI services

## Key Features

### Financial Management
- Transaction tracking (income/expense)
- Budget management with periods
- Goals & savings planner
- Multi-currency support (DOP/USD)
- Recurring transactions
- Payment method tracking

### AI Features
- Financial health analysis
- Automated insights generation
- Savings recommendations
- Challenge generation
- Quick tips
- Conversational coach

### Technical Features
- PWA with offline support
- Real-time sync with Firestore
- PDF report generation
- Push notifications
- Responsive design (mobile/desktop)
- Multi-language support (i18n)

## Data Models

### Core Entities

#### Transaction
```typescript
interface Transaction {
  id: string;
  amount: number;
  monetaryDetails?: MonetaryAmount;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: string;
  time?: string;
  isPlanned?: boolean;
  isRecurring: boolean;
  frequency?: 'weekly' | 'monthly' | 'yearly';
  paymentMethodType?: 'cash' | 'bank' | 'card' | 'other';
  paymentMethodId?: string;
  incomeType?: 'salary' | 'extra';
  notes?: string;
  mood?: 'happy' | 'neutral' | 'tired' | 'stressed';
  createdAt: number;
}
```

#### Goal
```typescript
interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  icon?: string;
  color?: string;
  priority?: 'high' | 'medium' | 'low';
}
```

#### Budget
```typescript
interface Budget {
  id: string;
  category: string;
  limit: number;
  period: 'monthly' | 'weekly';
  spent: number;
  remaining: number;
}
```

## AI Infrastructure

### AI Gateway (Singleton)
**File**: `services/aiGateway.ts`
- Single entry point for Gemini API
- Connection pooling
- API key management

### AI Coach Service
**File**: `services/aiCoachService.ts`
**Features**:
- Financial analysis with health scores
- Savings plan generation
- Strategy analysis (50/30/20 rule)
- Challenge generation
- Quick tips

**Advanced Capabilities**:
- Multi-level caching (localStorage + memory)
- Call deduplication
- Rate limiting
- User isolation (userId in cache keys)
- Context-aware analysis (seasonality, trends)

### Rate Limiting
**File**: `services/apiRateLimiter.ts`
- Queue-based system
- Priority levels (high/normal/low)
- Configurable limits

## Testing Strategy

### Framework
- Vitest 4.0.15
- Testing Library React 16.3.0

### Test Coverage
- Components: ExpensesScreen, IncomeScreen, TransactionsScreen
- Contexts: TransactionsContext
- Hooks: useBudgetPeriod
- Services: incomeService
- Utils: financialMathCore

### Test Files
```
├── components/
│   ├── ExpensesScreen.test.tsx
│   ├── IncomeScreen.test.tsx
│   └── TransactionsScreen.test.tsx
├── contexts/
│   └── TransactionsContext.test.ts
├── hooks/
│   └── useBudgetPeriod.test.ts
├── services/
│   └── incomeService.test.ts
└── utils/
    └── financialMathCore.test.ts
```

## Build Configuration

### Vite Config
- Code splitting (vendor, ui, charts)
- PWA plugin with Workbox
- Terser minification
- Source maps in development

### TypeScript Config
- Target: ES2022
- Module: ESNext
- Strict mode enabled
- Path aliases configured

## Deployment

### Firebase Hosting
- Configured in `firebase.json`
- Custom headers for security
- SPA redirect rules
- Asset caching

### PWA
- Service worker auto-update
- 9 icon sizes (72x72 to 512x512)
- Offline support
- Install shortcuts

## Performance Metrics

- **Lines of Code**: ~28,700
- **Components**: 56
- **Services**: 17
- **Hooks**: 14
- **Utils**: 13
- **Tests**: 7 files

## Current Status

### Git Status
```
Branch: main
Modified:
  - components/ExpensesScreen.tsx
  - services/expenseService.ts
```

### Recent Commits
- feat(expenses): Complete ExpensesScreen optimization
- feat: Add Edit/Delete for recurring expenses
- feat: synchronize currency architecture

## Environment

- **Platform**: Windows (win32)
- **Working Directory**: C:\Users\Admin\Desktop\FinanceApp\QUANTA
- **Git**: Initialized
- **Node Modules**: Installed

## Code Style & Standards

### TypeScript
- Strict mode enabled
- No implicit any
- Explicit return types preferred
- Interface over type (for objects)

### React
- Functional components only
- Hooks for state management
- Lazy loading for route components
- useMemo/useCallback for optimization

### File Naming
- Components: PascalCase.tsx
- Hooks: camelCase.ts (use prefix)
- Services: camelCase.ts (Service suffix)
- Utils: camelCase.ts

### Code Organization
- One component per file
- Grouped imports (React → libraries → local)
- Export at bottom of file
- Constants at top

## Security Considerations

### Firebase Security
- Firestore rules configured
- User isolation enforced
- API keys in environment variables

### AI Security
- Rate limiting enabled
- User data isolation
- API key rotation support
- No sensitive data in prompts

### PWA Security
- HTTPS required
- CSP headers configured
- No inline scripts

## Integration Points for AI Agents

### Where to Add New Features
1. **Services**: `services/[feature]Service.ts`
2. **Hooks**: `hooks/use[Feature].ts`
3. **Components**: `components/[Feature]Screen.tsx`
4. **Types**: `types.ts` (add interfaces)
5. **Tests**: `*.test.tsx` or `*.test.ts`

### Where to Extend AI
1. **New AI capabilities**: Extend `aiCoachService.ts`
2. **New AI providers**: Create service, use `aiGateway.ts` pattern
3. **Analytics**: Extend `deepAnalyticsAgent.ts` (to be created)
4. **Automation**: Add to `automationAgent.ts` (to be created)

### Where to Add UI
1. **Base components**: `components/base/`
2. **Layouts**: `components/layout/`
3. **Screens**: `components/[Name]Screen.tsx`
4. **Modals**: Use `useModalManager` hook

## Dependencies to Know

### Critical
- Firebase: Backend & auth
- Gemini AI: All AI features
- Recharts: All visualizations

### Important
- Lucide React: All icons
- jsPDF: Report generation
- Vite PWA: Offline functionality

## Common Tasks

### Add New Transaction Category
1. Update constants
2. Add to `categoryKeywords.ts`
3. Update UI dropdowns
4. Test categorization

### Add New AI Feature
1. Extend `aiCoachService.ts`
2. Add caching logic
3. Update rate limits
4. Create UI component
5. Add tests

### Add New Screen
1. Create component in `components/`
2. Add to `App.tsx` routes
3. Update navigation
4. Add lazy loading
5. Create tests

## Known Issues & TODOs

- Improve test coverage (currently ~25%)
- Add end-to-end tests
- Complete API documentation
- Add error boundary components
- Implement analytics tracking

## Support & Resources

### Documentation Gaps
- Need comprehensive README.md
- Missing API documentation
- Architecture docs incomplete
- Setup guide needed

### Testing Gaps
- Limited E2E tests
- Need more integration tests
- Missing performance tests

---

**Last Updated**: 2026-01-20
**Maintained By**: Development Team
**Claude AI Agents**: Enabled
