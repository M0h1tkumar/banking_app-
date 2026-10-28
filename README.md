# NeoBank - Next-Gen Banking Application

NeoBank is a full-stack, automated banking application built with Next.js, Express, Prisma, and PostgreSQL. It simulates a modern digital banking experience with role-based access control, secure fund transfers, and a dedicated bank operations dashboard for KYC approvals.

## Features

- **User Authentication & Authorization**: Secure JWT-based auth with `CUSTOMER` and `BANK_OPERATIONS` roles.
- **KYC Onboarding**: Users must submit KYC details (Aadhaar/PAN) which are reviewed by bank admins before accounts are activated.
- **Account Management**: Support for multiple account types (Savings, Current) with atomic balance calculations.
- **Fund Transfers**: Secure, transactional fund transfers between accounts.
- **Statements & Exports**: Dynamic financial statements with CSV download functionality.
- **BankOps Dashboard**: A secure portal for admins to approve/reject KYC applications and view the system audit trail.

---

## Testing Credentials & Roles

### Quick Demo Accounts

If using the seeded database (`npm run db:seed` in `backend/`):

| Role | Email | Password | Features / Access |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@neobank.com` | `password123` | Approved KYC, Savings Account (`1000000001`), ₹5,000 Balance, Fund Transfers, Statement CSV Export |
| **Bank Admin** | `admin@neobank.com` | `password123` | Role `BANK_OPERATIONS`: Access to `/bank` (KYC Approvals, Rejections, Audit Logs) |

---

### Manual Account Creation

If registering your own test accounts manually:

#### 1. Customer Account
- **Action**: Click "Register" on the frontend homepage.
- **Role**: Automatically assigned `CUSTOMER`.
- **Note**: After registering, you will be prompted to submit your KYC. You cannot transfer funds until a Bank Admin approves your KYC.

#### 2. Bank Admin Account (BankOps)
To test the Bank Operations Dashboard (KYC Approvals & Audit Logs), you need an account with the `BANK_OPERATIONS` role. Since this role cannot be acquired via the public registration form, you can grant it manually via the database or by running the seed script:

1. Register a new account normally via the frontend (e.g., `admin@neobank.com`).
2. Open your database with Prisma Studio:
   ```bash
   cd backend
   npx prisma studio
   ```
3. Find your user in the `User` table and change their `role` column from `CUSTOMER` to `BANK_OPERATIONS`.
4. Log back in to the frontend. You will now have access to the `/bank` dashboard to approve other users' KYC!

---

## Tech Stack

- **Frontend**: Next.js (App Router), React, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: Zod
- **Testing**: Jest, React Testing Library, Supertest

## Running Locally

### Backend Setup
```bash
cd backend
npm install
# Set up your .env file with DATABASE_URL and JWT_SECRET
npx prisma db push
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
# Ensure NEXT_PUBLIC_API_URL is set if not using localhost:4000
npm run dev
```
