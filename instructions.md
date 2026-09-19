# Online Banking Simulation — System Architecture & Sprint Backlog

**Version:** 1.0  
**Status:** READY FOR IMPLEMENTATION  
**Target:** Antigravity IDE Agent  
**Generated from:** BRD.docx, FRD.docx, UAT.docx, existing Prisma schema

---

## 1. System Architecture

### 1.1 High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ONLINE BANKING SIMULATION                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│  │   Frontend   │────▶│   Backend    │────▶│  Database    │                │
│  │  (Next.js)   │     │  (Express)   │     │ (PostgreSQL) │                │
│  │  Port 3000   │     │  Port 4000   │     │  Port 5432   │                │
│  └──────────────┘     └──────────────┘     └──────────────┘                │
│         │                     │                     │                       │
│         │                     │                     │                       │
│         ▼                     ▼                     ▼                       │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│  │  Components  │     │   Services   │     │   Prisma     │                │
│  │  - Pages     │     │   - Auth     │     │   - Models   │                │
│  │  - Forms     │     │   - KYC      │     │   - Migrate  │                │
│  │  - Tables    │     │   - Account  │     │   - Seed     │                │
│  │  - Charts    │     │   - Transfer │     │              │                │
│  │  - Auth      │     │   - Statement│     │              │                │
│  └──────────────┘     └──────────────┘     └──────────────┘                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend** | Next.js | 14+ (App Router) | React framework with SSR |
| | React | 18+ | UI library |
| | TypeScript | 5+ | Type safety |
| | Tailwind CSS | 3.4+ | Utility-first styling |
| | React Hook Form | 7+ | Form handling |
| | Zod | 3.22+ | Schema validation |
| | Axios | 1.6+ | HTTP client |
| | React Hot Toast | 2.4+ | Notifications |
| **Backend** | Node.js | 20+ | Runtime |
| | Express.js | 4.18+ | Web framework |
| | TypeScript | 5+ | Type safety |
| | Prisma ORM | 5.10+ | Database ORM |
| | PostgreSQL | 15+ | Primary database |
| | JWT | 9+ | Authentication |
| | bcryptjs | 2.4+ | Password hashing |
| | Zod | 3.22+ | Request validation |
| **DevOps** | Docker | Latest | Containerization |
| | Docker Compose | Latest | Multi-container orchestration |

### 1.3 Database Schema (Prisma) — Already Defined

```prisma
// /workspace/banking_app/backend/prisma/schema.prisma
// Models: User, KycRecord, Account, Transaction, Transfer, Session, AuditLog
// Enums: Role, UserStatus, KycStatus, AccountType, AccountStatus, TransactionType, TransactionStatus, TransferStatus, SessionStatus
```

**Key Relationships:**
- User 1──1 KycRecord
- User 1──N Account
- Account 1──N Transaction
- Account 1──N Transfer (sent)
- Account 1──N Transfer (received)
- User 1──N Session
- User 1──N AuditLog

### 1.4 API Endpoint Contracts

#### Authentication
| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | `/api/auth/register` | Public | Customer registration + KYC submission |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| POST | `/api/auth/logout` | All | Invalidate session |
| GET | `/api/auth/me` | All | Current user profile |

#### KYC (Customer)
| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/api/kyc/status` | Customer | Check KYC status |
| GET | `/api/kyc/documents` | Customer, BankOps | View KYC documents |

#### KYC (Bank Operations)
| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/api/bank/kyc/pending` | BankOps | List pending KYC reviews |
| POST | `/api/bank/kyc/:id/approve` | BankOps | Approve KYC |
| POST | `/api/bank/kyc/:id/reject` | BankOps | Reject KYC |

#### Accounts
| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | `/api/accounts` | Customer | Create account (PENDING) |
| GET | `/api/accounts` | Customer, BankOps | List accounts |
| GET | `/api/accounts/:id` | Customer, BankOps | Get account details |
| POST | `/api/bank/accounts/:id/activate` | BankOps | Activate account |
| POST | `/api/bank/accounts/:id/freeze` | BankOps | Freeze account |
| POST | `/api/bank/accounts/:id/close` | BankOps | Close account |

#### Transfers
| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | `/api/transfers` | Customer | Initiate transfer |
| GET | `/api/transfers` | Customer | List own transfers |
| GET | `/api/transfers/:id` | Customer, BankOps | Get transfer details |

#### Statements
| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/api/statements/:accountId` | Customer, BankOps | View statement |
| GET | `/api/statements/:accountId/download` | Customer | Download PDF/CSV |

#### Audit
| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/api/bank/audit` | BankOps | View audit trail (paginated, filterable) |

### 1.5 Request/Response Schemas

```typescript
// Auth
interface RegisterRequest {
  email: string;
  password: string;
  aadhaar: string;  // 12 digits
  pan: string;      // 10 chars: AAAAA9999A
}
interface LoginRequest {
  email: string;
  password: string;
}
interface AuthResponse {
  user: UserDTO;
  token: string;
}

// KYC
interface KycSubmitRequest {
  aadhaar: string;
  pan: string;
}
interface KycResponse {
  id: string;
  status: KycStatus;
  aadhaar: string;  // masked: XXXX XXXX 1234
  pan: string;      // masked: AAAAA****A
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

// Account
interface AccountCreateRequest {
  type: 'SAVINGS' | 'CURRENT';
}
interface AccountResponse {
  id: string;
  accountNumber: string;
  type: AccountType;
  status: AccountStatus;
  balance: string;  // Decimal as string
  currency: string;
  createdAt: string;
}

// Transfer
interface TransferRequest {
  fromAccountId: string;
  toAccountNumber: string;
  amount: string;   // Decimal as string
  description?: string;
}
interface TransferResponse {
  id: string;
  referenceId: string;
  status: TransferStatus;
  amount: string;
  senderAccountId: string;
  receiverAccountId: string;
  createdAt: string;
  completedAt?: string;
}

// Statement
interface StatementResponse {
  accountId: string;
  accountNumber: string;
  period: { from: string; to: string };
  openingBalance: string;
  closingBalance: string;
  transactions: StatementTransaction[];
}
interface StatementTransaction {
  id: string;
  date: string;
  type: TransactionType;
  amount: string;
  balanceAfter: string;
  description: string;
  referenceId?: string;
}

// Audit
interface AuditLogResponse {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}
```

### 1.6 Frontend Route Structure (Next.js App Router)

```
/ (root) → redirects to /login
/login                    → Login page
/register                 → Registration + KYC page
/dashboard                → Customer dashboard (accounts summary)
/accounts/:id             → Account detail + transactions
/accounts/:id/statement   → View statement
/accounts/:id/transfer    → Initiate transfer
/kyc/status               → KYC status page

/bank                     → Bank operations dashboard
/bank/kyc                 → Pending KYC reviews
/bank/kyc/:id             → KYC review detail (approve/reject)
/bank/accounts            → All accounts management
/bank/accounts/:id        → Account detail (activate/freeze/close)
/bank/audit               → Audit trail viewer
/bank/transfers           → All transfers monitoring
```

### 1.7 Component Architecture

```
src/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Redirect to /login
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── dashboard/page.tsx
│   ├── accounts/
│   │   ├── [id]/page.tsx
│   │   ├── [id]/statement/page.tsx
│   │   └── [id]/transfer/page.tsx
│   ├── kyc/status/page.tsx
│   └── bank/
│       ├── page.tsx
│       ├── kyc/page.tsx
│       ├── kyc/[id]/page.tsx
│       ├── accounts/page.tsx
│       ├── accounts/[id]/page.tsx
│       ├── audit/page.tsx
│       └── transfers/page.tsx
├── components/
│   ├── ui/                       # Reusable UI primitives
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Table.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Badge.tsx
│   │   ├── Spinner.tsx
│   │   └── Toast.tsx
│   ├── forms/                    # Form components
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── TransferForm.tsx
│   │   └── KycForm.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── ProtectedRoute.tsx
│   └── bank/
│       ├── KycReviewCard.tsx
│       ├── AccountActions.tsx
│       └── AuditTable.tsx
├── lib/
│   ├── api.ts                    # Axios instance + interceptors
│   ├── auth.ts                   # JWT helpers, token storage
│   ├── validation/               # Zod schemas
│   │   ├── auth.ts
│   │   ├── kyc.ts
│   │   ├── transfer.ts
│   │   └── account.ts
│   ├── utils/
│   │   ├── format.ts             # Currency, date, masking
│   │   └── constants.ts
│   └── hooks/
│       ├── useAuth.ts
│       ├── useAccounts.ts
│       ├── useTransfers.ts
│       └── useStatement.ts
├── types/
│   ├── api.ts                    # API request/response types
│   ├── user.ts
│   ├── account.ts
│   ├── transfer.ts
│   └── audit.ts
└── styles/
    └── globals.css               # Tailwind imports
```

### 1.8 Backend Service Structure

```
src/
├── index.ts                      # Express app entry
├── config/
│   ├── env.ts                    # Validated env config
│   └── prisma.ts                 # Prisma client singleton
├── middleware/
│   ├── auth.ts                   # JWT verification
│   ├── rbac.ts                   # Role-based access control
│   ├── validation.ts             # Zod request validation
│   ├── errorHandler.ts           # Global error handling
│   └── rateLimiter.ts            # Basic rate limiting
├── routes/
│   ├── auth.ts
│   ├── kyc.ts
│   ├── accounts.ts
│   ├── transfers.ts
│   ├── statements.ts
│   └── audit.ts
├── services/
│   ├── authService.ts
│   ├── kycService.ts
│   ├── accountService.ts
│   ├── transferService.ts
│   ├── statementService.ts
│   └── auditService.ts
├── validators/
│   ├── aadhaar.ts                # Format: ^\d{12}$
│   ├── pan.ts                    # Format: ^[A-Z]{5}[0-9]{4}[A-Z]$
│   └── common.ts
├── utils/
│   ├── jwt.ts
│   ├── password.ts
│   ├── accountNumber.ts          # Generate unique account numbers
│   ├── referenceId.ts            # Generate unique reference IDs
│   └── decimal.ts                # Prisma Decimal helpers
├── errors/
│   ├── AppError.ts               # Base error class
│   ├── ValidationError.ts
│   ├── AuthenticationError.ts
│   ├── AuthorizationError.ts
│   ├── NotFoundError.ts
│   └── BusinessRuleError.ts
└── seeds/
    └── seed.ts                   # Deterministic test data
```

### 1.9 Security & Compliance

| Requirement | Implementation |
|-------------|----------------|
| **Authentication** | JWT with HttpOnly cookies + short expiry (15min access, 7d refresh) |
| **Password** | bcryptjs, 12 rounds |
| **RBAC** | Middleware on every route; `CUSTOMER` vs `BANK_OPERATIONS` |
| **Data Masking** | Aadhaar: `XXXX XXXX 1234`; PAN: `AAAAA****A` |
| **Audit Logging** | Append-only; every state change logged with actor, action, timestamp |
| **Input Validation** | Zod schemas on all endpoints |
| **Rate Limiting** | 100 req/min per IP; stricter on auth endpoints |
| **CORS** | Restricted to frontend origin |
| **Helmet** | Security headers |

### 1.10 State Transitions (from FRD)

```
Account:        PENDING → ACTIVE → FROZEN → CLOSED
KYC Record:     SUBMITTED → IN_REVIEW → APPROVED → REJECTED
Transaction:    PENDING → COMPLETED → FAILED → REVERSED
Session:        ACTIVE → EXPIRED → LOGGED_OUT
Customer:       PENDING_KYC → KYC_SUBMITTED → ACTIVE → SUSPENDED
```

---

## 2. Sprint Backlog

### Sprint 0: Foundation & Setup (Week 1)

| ID | Task | Description | Acceptance Criteria | Est. |
|----|------|-------------|---------------------|------|
| S0-01 | Initialize Next.js frontend | `npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` | Project builds, dev server runs on :3000 | 2h |
| S0-02 | Initialize Express backend | Set up TypeScript, ESLint, Prettier, folder structure | `npm run dev` starts server on :4000 | 2h |
| S0-03 | Docker Compose | PostgreSQL, pgAdmin, backend, frontend services | `docker compose up -d` brings up all services | 3h |
| S0-04 | Prisma setup | Generate client, run migration, seed script | `npx prisma migrate dev && npx prisma db seed` works | 2h |
| S0-05 | Shared types package | Create `packages/shared-types` for API contracts | Both frontend & backend import types | 2h |
| S0-06 | CI/CD pipeline | GitHub Actions: lint, typecheck, test, build | PR checks pass | 3h |
| S0-07 | Environment config | `.env.example` with all required variables | Documented, validated at startup | 1h |

---

### Sprint 1: Authentication & KYC (Week 2)

| ID | Task | Description | Acceptance Criteria | Est. |
|----|------|-------------|---------------------|------|
| S1-01 | POST /api/auth/register | Create user + KycRecord (SUBMITTED), hash password | User created, KYC pending, 201 response | 4h |
| S1-02 | POST /api/auth/login | Verify credentials, issue JWT, create Session | Valid JWT returned, session in DB | 3h |
| S1-03 | POST /api/auth/logout | Invalidate session, clear cookie | Session status = LOGGED_OUT | 1h |
| S1-04 | GET /api/auth/me | Return current user from token | User DTO with role, status | 1h |
| S1-05 | Auth middleware | Verify JWT, attach user to request | 401 if invalid/expired | 2h |
| S1-06 | RBAC middleware | Check role per route | 403 if insufficient role | 2h |
| S1-07 | Aadhaar validator | Format: 12 digits, Verhoeff checksum (optional) | Rejects invalid, accepts valid | 2h |
| S1-08 | PAN validator | Format: AAAAA9999A regex | Rejects invalid, accepts valid | 1h |
| S1-09 | Frontend: Login page | Email/password form, validation, error handling | Submits to API, redirects on success | 3h |
| S1-10 | Frontend: Register page | Multi-step: details → KYC → submit | Creates user + KYC, shows status | 4h |
| S1-11 | Frontend: Auth context | React context for user, token, login/logout | Persists across refresh | 2h |
| S1-12 | Frontend: Protected routes | Redirect to /login if unauthenticated | Works for all protected pages | 2h |

---

### Sprint 2: Account Management (Week 3)

| ID | Task | Description | Acceptance Criteria | Est. |
|----|------|-------------|---------------------|------|
| S2-01 | POST /api/accounts | Customer creates account (PENDING) | Account created, unique account number | 2h |
| S2-02 | GET /api/accounts | List accounts for current user | Returns user's accounts only | 1h |
| S2-03 | GET /api/accounts/:id | Account details + transactions | Includes recent transactions (paginated) | 2h |
| S2-04 | POST /api/bank/accounts/:id/activate | BankOps activates PENDING → ACTIVE | Status = ACTIVE, audit logged | 2h |
| S2-05 | POST /api/bank/accounts/:id/freeze | BankOps freezes ACTIVE → FROZEN | Status = FROZEN, audit logged | 1h |
| S2-06 | POST /api/bank/accounts/:id/close | BankOps closes → CLOSED | Status = CLOSED, audit logged | 1h |
| S2-07 | Account number generator | Unique, formatted: `BANK` + 12 digits | No collisions, deterministic seed | 1h |
| S2-08 | Frontend: Customer dashboard | Account cards with status, balance, actions | Shows all accounts, links to detail | 3h |
| S2-09 | Frontend: Account detail page | Transactions table, balance, account info | Paginated, filterable transactions | 3h |
| S2-10 | Frontend: Create account form | Modal with account type selector | Submits to API, refreshes list | 2h |
| S2-11 | Frontend: BankOps accounts list | Table with all accounts, status badges | Filter by status, search by number | 3h |
| S2-12 | Frontend: BankOps account actions | Activate/Freeze/Close buttons per row | Calls API, updates UI optimistically | 2h |

---

### Sprint 3: Fund Transfers (Week 4)

| ID | Task | Description | Acceptance Criteria | Est. |
|----|------|-------------|---------------------|------|
| S3-01 | POST /api/transfers | Customer initiates transfer | Validates balance, daily cap, creates PENDING | 4h |
| S3-02 | Transfer processing | Atomic: debit sender, credit receiver, COMPLETED | Uses DB transaction, audit both accounts | 3h |
| S3-03 | GET /api/transfers | List transfers for account | Sent + received, paginated, filterable | 2h |
| S3-04 | GET /api/transfers/:id | Transfer detail | Full info for both parties | 1h |
| S3-05 | Daily transfer cap enforcement | Configurable limit per account/day | Rejects if exceeded (OQ-003) | 2h |
| S3-06 | Minimum balance enforcement | Configurable threshold (OQ-002) | Rejects if balance would drop below | 2h |
| S3-07 | Reference ID generator | Unique: `TXN` + timestamp + random | No collisions | 1h |
| S3-08 | Frontend: Transfer form | Receiver account number, amount, description | Validates recipient exists, amount > 0 | 3h |
| S3-09 | Frontend: Transfer confirmation | Review screen before submit | Shows masked receiver, amount, fees | 2h |
| S3-10 | Frontend: Transfer history | Table with status badges, amounts | Infinite scroll, filter by date/type | 3h |
| S3-11 | Frontend: BankOps transfers monitor | Read-only view of all transfers | Filter by status, date, accounts | 2h |

---

### Sprint 4: Statements & Reporting (Week 5)

| ID | Task | Description | Acceptance Criteria | Est. |
|----|------|-------------|---------------------|------|
| S4-01 | GET /api/statements/:accountId | Statement data for period | Opening/closing balance, transactions | 3h |
| S4-02 | GET /api/statements/:accountId/download | Generate PDF/CSV download | PDF with formatting, CSV raw data | 4h |
| S4-03 | Date range validation | Default: current month; max: 12 months | Rejects invalid ranges | 1h |
| S4-04 | Statement service | Aggregates transactions, calculates balances | Handles TRANSFER_IN/OUT correctly | 3h |
| S4-05 | Frontend: Statement viewer | Table with date, type, amount, balance | Sortable, paginated | 3h |
| S4-06 | Frontend: Download buttons | PDF and CSV download | Triggers file download | 2h |
| S4-07 | Frontend: BankOps statement access | Can view any account's statement | Role-checked on backend | 1h |

---

### Sprint 5: KYC Review & Audit (Week 6)

| ID | Task | Description | Acceptance Criteria | Est. |
|----|------|-------------|---------------------|------|
| S5-01 | GET /api/bank/kyc/pending | List SUBMITTED KYC records | Paginated, searchable by email/name | 2h |
| S5-02 | POST /api/bank/kyc/:id/approve | APPROVE KYC → user ACTIVE, account ACTIVE | Updates UserStatus, AccountStatus | 2h |
| S5-03 | POST /api/bank/kyc/:id/reject | REJECT KYC with reason | UserStatus = SUSPENDED, audit logged | 2h |
| S5-04 | GET /api/bank/audit | Audit trail with filters | Actor, action, entity, date range | 3h |
| S5-05 | Audit service | Centralized logging for all state changes | Called from all services | 3h |
| S5-06 | Frontend: KYC review queue | Cards with approve/reject buttons | Shows masked Aadhaar/PAN | 3h |
| S5-07 | Frontend: KYC detail modal | Full documents, approve/reject form | Pre-fills reason on reject | 2h |
| S5-08 | Frontend: Audit trail viewer | Table with filters, pagination | Export to CSV | 3h |

---

### Sprint 6: Polish, Testing & Deployment (Week 7)

| ID | Task | Description | Acceptance Criteria | Est. |
|----|------|-------------|---------------------|------|
| S6-01 | Unit tests: backend services | Jest + Supertest, >80% coverage | All services tested | 8h |
| S6-02 | Unit tests: frontend components | React Testing Library, >70% coverage | Critical paths covered | 6h |
| S6-03 | Integration tests | API contracts, auth flows | E2E scenarios pass | 4h |
| S6-04 | Accessibility audit | axe-core, keyboard navigation | WCAG 2.1 AA compliance | 4h |
| S6-05 | Error boundaries & fallback UI | Graceful error handling | No white screens | 2h |
| S6-06 | Loading states & skeletons | All async operations | Perceived performance | 2h |
| S6-07 | Responsive design | Mobile, tablet, desktop | Tailwind breakpoints | 3h |
| S6-08 | Seed deterministic test data | 5 customers, 10 accounts, 50 transfers | `npm run db:seed` reproducible | 2h |
| S6-09 | Production Docker build | Multi-stage, non-root user | Images < 500MB | 2h |
| S6-10 | Vercel deployment | Frontend on Vercel, backend on Railway/Render | Live URLs, env vars configured | 2h |
| S6-11 | Documentation | README, API docs (OpenAPI), runbook | Complete for handoff | 3h |

---

## 3. Cross-Cutting Concerns

### 3.1 Error Handling Strategy

```typescript
// Backend: Standardized error responses
interface ApiError {
  success: false;
  error: {
    code: string;        // e.g., "VALIDATION_ERROR", "INSUFFICIENT_BALANCE"
    message: string;     // User-friendly
    details?: Record<string, any>;  // Field errors, etc.
  };
}

// Frontend: Toast notifications + inline form errors
// 401 → redirect to login
// 403 → show "Access denied"
// 422 → show field errors
// 500 → generic "Something went wrong"
```

### 3.2 Decimal Handling

```typescript
// Prisma returns Decimal as object; serialize as string in API
// Frontend: use `decimal.js` or `big.js` for calculations
// Always validate: amount > 0, max 2 decimal places
```

### 3.3 Audit Logging Pattern

```typescript
// Called after every successful state change
await auditService.log({
  actor: user.id,
  action: 'ACCOUNT_ACTIVATED',
  entity: 'Account',
  entityId: account.id,
  oldValue: JSON.stringify({ status: 'PENDING' }),
  newValue: JSON.stringify({ status: 'ACTIVE' }),
  metadata: { ip: req.ip, userAgent: req.headers['user-agent'] }
});
```

### 3.4 Test Data Requirements (Deterministic)

| Entity | Count | Notes |
|--------|-------|-------|
| BankOps users | 2 | Pre-created, known credentials |
| Customers | 5 | With KYC: 2 APPROVED, 2 PENDING, 1 REJECTED |
| Accounts | 10 | Mix of PENDING, ACTIVE, FROZEN, CLOSED |
| Transfers | 50 | Various statuses, dates spanning 3 months |
| Audit logs | 100+ | Cover all action types |

---

## 4. Open Questions (Blockers)

| ID | Question | Impact | Owner | Resolution Target |
|----|----------|--------|-------|-------------------|
| OQ-001 | UAT execution ownership | Blocks test plan finalization | TBD | Before Sprint 6 |
| OQ-002 | Minimum balance threshold | Blocks transfer validation (S3-06) | Business | Sprint 3 start |
| OQ-003 | Daily transfer cap | Blocks transfer validation (S3-05) | Business | Sprint 3 start |
| OQ-004 | data-testid convention | Blocks testability (FR-015, S6-01) | QA | Sprint 1 start |

---

## 5. Definition of Done

A sprint task is **Done** when:
- [ ] Code implemented and type-checks (`tsc --noEmit`)
- [ ] Unit tests pass (>80% backend, >70% frontend)
- [ ] Linting passes (`npm run lint`)
- [ ] Manual verification against acceptance criteria
- [ ] Code reviewed (self-review for solo, PR for team)
- [ ] Deployed to staging environment
- [ ] No console errors or warnings

---

## 6. Deployment Checklist

### Pre-deployment
- [ ] All migrations applied to production DB
- [ ] Seed data run (or production seed script)
- [ ] Environment variables set on hosting platforms
- [ ] SSL certificates configured
- [ ] CORS origins set to production frontend URL
- [ ] Rate limits configured for production traffic

### Post-deployment
- [ ] Health checks pass (`/health` endpoints)
- [ ] Smoke test: register → KYC → activate → transfer → statement
- [ ] BankOps login and KYC review works
- [ ] Audit trail records visible
- [ ] Monitoring/alerting configured

---

## 7. File Structure Summary

```
/workspace/banking_app/
├── instructions.md           # THIS FILE
├── backend/
│   ├── package.json
│   ├── prisma/
│   │   └── schema.prisma    # ✅ COMPLETE
│   └── src/                 # TO BE CREATED per Sprint 0-6
├── frontend/
│   └── src/                 # TO BE CREATED per Sprint 0-6
└── docker-compose.yml       # TO BE CREATED in Sprint 0
```

---

## 8. Quick Start for Antigravity IDE Agent

```bash
# 1. Backend setup
cd /workspace/banking_app/backend
npm install
cp .env.example .env  # Configure DATABASE_URL
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
npm run dev  # :4000

# 2. Frontend setup (new terminal)
cd /workspace/banking_app/frontend
npm install
cp .env.example .env  # Configure NEXT_PUBLIC_API_URL
npm run dev  # :3000

# 3. Or use Docker
cd /workspace/banking_app
docker compose up -d
```

---

**Next Action:** Begin Sprint 0 — Foundation & Setup