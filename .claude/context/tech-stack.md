# QUANTA Tech Stack

## Frontend

### Core
- **React**: 19.2.1 - UI framework
- **TypeScript**: 5.8.2 - Type safety
- **Vite**: 6.2.0 - Build tool & dev server

### UI Libraries
- **Lucide React**: 0.556.0 - Icon system
- **Recharts**: 3.5.1 - Charts and data visualization
- **React Markdown**: 10.1.0 - Markdown rendering

### Styling
- **Tailwind CSS**: Utility-first CSS (via class names)
- **CSS**: Custom styles where needed

## Backend

### Firebase (12.6.0)
- **Firestore**: NoSQL database with real-time sync
- **Authentication**: Email/password, Google, etc.
- **Hosting**: Static site hosting with CDN
- **Security Rules**: Database access control

## AI/ML

### Google Generative AI (0.24.1)
- **Gemini API**: AI-powered analysis
- **Models**:
  - `gemini-1.5-flash-8b`: Fast, cost-effective
  - `gemini-1.5-flash`: Balanced
  - `gemini-1.5-pro`: High quality

**Use Cases**:
- Financial health analysis
- Savings recommendations
- Budget optimization
- Conversational coach

## Testing

### Test Framework
- **Vitest**: 4.0.15 - Fast unit test framework
- **Testing Library React**: 16.3.0 - Component testing
- **Testing Library User Event**: 14.6.1 - User interaction simulation
- **Testing Library Jest DOM**: 6.9.1 - Extended matchers
- **JSDOM**: 27.3.0 - DOM simulation

## Build & Deployment

### Build Tools
- **Vite**: Development server and production build
- **TypeScript Compiler**: Type checking
- **Terser**: 5.44.1 - JavaScript minification

### PWA
- **Vite Plugin PWA**: 1.2.0 - PWA capabilities
- **Workbox**: Service worker & caching (via Vite PWA)

### Deployment
- **Firebase Hosting**: Static hosting
- **Firebase CLI**: Deployment tool

## Reports & Export

### PDF Generation
- **jsPDF**: 3.0.4 - PDF creation
- **jsPDF AutoTable**: 5.0.2 - Tables in PDFs

## Development Tools

### Image Processing
- **Sharp**: 0.34.5 - Image optimization (dev dependency)

## Version Control
- **Git**: Source control
- **GitHub**: Repository hosting (assumed)

## Environment

### Node.js
- **Required**: 18.x or higher
- **Package Manager**: npm 9.x

### Browser Support
- **Modern browsers**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Mobile**: iOS Safari 14+, Chrome Android 90+

## API Integrations

### Gemini AI
- **Base URL**: `https://generativelanguage.googleapis.com`
- **Authentication**: API key
- **Rate Limiting**: Implemented client-side

### Firebase
- **Firestore**: Real-time database
- **Auth**: User authentication
- **Storage**: File uploads (if needed)

## Development Workflow

### Scripts
```json
{
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "test": "vitest",
  "test:coverage": "vitest --coverage"
}
```

### Environment Variables
```bash
# .env.local
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
VITE_GEMINI_API_KEY=xxx
```

## Infrastructure

### Hosting Architecture
```
User → Firebase CDN → Firebase Hosting → dist/
                    ↓
                 Firestore (data)
                    ↓
                 Firebase Auth
```

### Caching Strategy
- **Service Worker**: Cache static assets
- **LocalStorage**: Cache AI responses
- **Memory**: Cache in-flight requests

## Performance

### Bundle Size Targets
- **Vendor chunk**: < 200KB gzipped
- **Main chunk**: < 100KB gzipped
- **Total**: < 500KB gzipped

### Optimization Techniques
- Code splitting (vendor, ui, charts)
- Lazy loading (route-based)
- Tree shaking
- Minification (Terser)
- Image optimization (Sharp)

## Security

### Authentication
- Firebase Authentication
- Session management
- Protected routes

### Data Security
- Firestore security rules
- User data isolation
- No hardcoded secrets
- Environment variables for keys

### Frontend Security
- TypeScript strict mode
- Input validation
- XSS prevention
- CSRF protection (Firebase handles)

## Monitoring (Future)

### Potential Additions
- **Sentry**: Error tracking
- **Firebase Analytics**: Usage analytics
- **Firebase Performance**: Performance monitoring
- **Lighthouse CI**: Performance auditing

## Future Considerations

### Potential Migrations
- **State**: Context API → Zustand/Redux (if needed)
- **Backend**: Firebase → Supabase (if needed)
- **Deployment**: Firebase → Vercel/Netlify (if needed)
- **AI**: Gemini → Multi-provider (OpenAI, Claude, etc.)

### Scaling Options
- **CDN**: Cloudflare (if custom domain)
- **Database**: PostgreSQL (if complex queries needed)
- **Caching**: Redis (if distributed cache needed)
- **Queue**: Bull/BullMQ (for background jobs)
