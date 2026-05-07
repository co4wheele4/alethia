# Aletheia Frontend - Current Status

**Date**: January 14, 2026  
**Status**: ✅ **Production Ready** - Comprehensive Testing & Components Complete

## ✅ Current Implementation

### Core Infrastructure
- ✅ **Next.js 16** with App Router
- ✅ **React 19**
- ✅ **TypeScript** - Strict mode enabled, no compilation errors
- ✅ **Apollo Client** - Configured with authentication and error handling
- ✅ **Tailwind CSS** - Styling configured
- ✅ **JWT Authentication** - Login/logout functionality

### Current Features
1. **Authentication** ✅
   - Login form component with Register toggle
   - Change Password form
   - Forgot Password form
   - Auth hook (`useAuth`) with full auth operations
   - Token management (localStorage)
   - Auto token injection in GraphQL requests
   - SSR-safe hydration patterns

2. **GraphQL Integration** ✅
   - Apollo Client configured with auth and error links
   - Error handling and auth error detection
   - Hello query
   - Login, Register, ChangePassword, ForgotPassword mutations
   - MSW (Mock Service Worker) for testing

3. **Components** ✅ (80+ components)
   - **UI Components**: LoginForm, ChangePasswordForm, ForgotPasswordForm, ThemeToggle, OptimisticButton, GraphQLExample, ErrorBoundary
   - **AI Components**: AIRationalePanel, AIResultCard, HumanOverrideButton
   - **Clarity Components**: WhyPanel, StatusPill, ReasoningStepsList, ChangeTimeline, etc.
   - **Integrity Components**: SystemStatusPanel, ErrorBanner, AuditView, etc.
   - **Truth Discovery Components**: KnowledgeTreeView, KnowledgeNode, SummaryCard, DetailDrawer, etc.
   - **Search Components**: SemanticSearchBox, SearchResultList, KnowledgeGraphCanvas, etc.
   - **Layout Components**: AletheiaLayout, ContentSurface, ServerHeader, etc.
   - And many more across 10 categories

4. **Testing** ✅
   - **1177** unit tests across **193** test files (Vitest + React Testing Library; verified 2026-04-28)
   - **50** E2E tests across **22** Playwright spec files (Chromium default; full browser matrix in CI when enabled)
   - Coverage enabled (re-run `npm run test:cov` for current %)
   - MSW handlers for GraphQL mocking

## 📊 Code Quality

- **TypeScript**: ✅ No compilation errors (strict mode)
- **ESLint**: ✅ No linting errors
- **Dependencies**: ✅ All up-to-date, 0 vulnerabilities
- **Testing (verified 2026-04-28)**: ✅ 1177 Vitest tests + 50 Playwright tests (default project); coverage — run `npm run test:cov`
- **Build**: ✅ Compiles successfully

## 🔍 Governed backend surface (MVP)

The shipped GraphQL contract focuses on **claims, evidence, adjudication, documents, deterministic search, review coordination, and integrity**—not on lessons, embeddings, or AI query logging (those were removed from backend schema and DB **2026-05-06**). See `aletheia-backend/src/schema.gql` and `docs/context/aletheia-core-context.md`.

### Domains to integrate next (examples)
1. **Users** — Auth profile, admin user list where applicable
2. **Documents & chunks** — Ingestion-aligned document flows
3. **Claims & evidence** — Core epistemic workflows per ADR-018/019
4. **Search** — ADR-033 non-semantic `searchClaims` / `searchEvidence`
5. **Reviews & assignments** — ADR-014/015 coordination surfaces (persisted review coordination and assignment)

### GraphQL operations (illustrative; see schema snapshot)
- **Queries**: `claims`, `documents`, `searchClaims`, `searchEvidence`, `entities`, `user`, `users` (admin), etc.
- **Mutations**: `createClaim`, `createEvidence`, adjudication and review mutations as exposed in `schema.gql`
- **List pagination**: `claims` / `documents` use **`limit` + `offset`** (not legacy `aiQueriesPaged`)

## 🎯 Recommended Next Steps

### High Priority
1. **User dashboard** — Authenticated home aligned with governed routes
2. **Claims & evidence UX** — Create/link/view per ADR-019
3. **Documents management** — Upload and manage documents
4. **User profile** — View and update user information

### Medium Priority
1. **Entity explorer** — Browse entities and relationships (read-heavy)
2. **Search** — Wire production UI to deterministic search only (ADR-033)
3. **Responsive design** — Mobile-friendly layouts

### Low Priority
1. **Advanced features** — Relationship visualization, bundle export UX
2. **Analytics** — Operational metrics only (no inference-as-truth)
3. **Export** — Documents / bundles per product scope
4. **Theming** — Dark mode, user preferences

## 📁 Project Structure

```
aletheia-frontend/
├── app/
│   ├── components/
│   │   ├── ui/           # UI components (LoginForm, GraphQLExample)
│   │   └── layout/       # Layout components (empty)
│   ├── hooks/
│   │   ├── useAuth.ts    # Authentication hook
│   │   └── useHello.ts   # Example query hook
│   ├── lib/
│   │   ├── constants.ts  # App constants
│   │   ├── graphql/      # GraphQL queries/mutations
│   │   └── utils/        # Utility functions (auth.ts)
│   ├── providers/
│   │   └── apollo-provider.tsx  # Apollo Client provider
│   ├── services/
│   │   └── apollo-client.ts     # Apollo Client configuration
│   ├── types/            # TypeScript types (empty)
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── public/               # Static assets
└── package.json
```

## 🔧 Technical Stack

- **Framework**: Next.js 16.1.1 (App Router)
- **React**: 19.2.3
- **GraphQL Client**: Apollo Client 4.0.13
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript 5
- **Build Tool**: Next.js (Turbopack in dev)

## 📝 Configuration Files

- ✅ `tsconfig.json` - TypeScript configuration (strict mode)
- ✅ `next.config.ts` - Next.js configuration
- ✅ `eslint.config.mjs` - ESLint configuration (Next.js preset)
- ✅ `postcss.config.mjs` - PostCSS for Tailwind

## 🚀 Development Commands

```bash
# Development
npm run dev              # Start dev server
npm run start:dev        # Same as above

# Building
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run type-check       # TypeScript type checking
npm run format           # Format with Prettier
```

## 🔐 Environment Variables

Required (create `.env.local`):
```env
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:3000/graphql
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## 📚 Documentation

- `README.md` - Getting started guide
- `SETUP.md` - Setup instructions
- `GRAPHQL_SETUP.md` - GraphQL integration details

## ✅ Production Readiness

### Ready ✅
- TypeScript compilation
- Basic authentication
- GraphQL client setup
- Component structure

### Needs Work
- Feature implementation (dashboard, CRUD operations)
- Error boundaries
- Loading states (global)
- Form validation
- Testing (unit, integration, e2e)

---

**Next Actions**: Choose a feature to implement from the recommended list above.
