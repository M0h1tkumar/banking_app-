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

To fully test the application, you will need two types of accounts:

### 1. Customer Account
You can create a standard customer account directly from the frontend UI:
- **Action**: Click "Register" on the homepage.
- **Role**: Automatically assigned `CUSTOMER`.
- **Note**: After registering, you will be prompted to submit your KYC. You cannot transfer funds until a Bank Admin approves your KYC.

### 2. Bank Admin Account (BankOps)
To test the Bank Operations Dashboard (KYC Approvals & Audit Logs), you need an account with the `BANK_OPERATIONS` role. Since this role cannot be acquired via the public registration form, you must grant it manually via the database:

1. Register a new account normally via the frontend (e.g., `admin@neobank.com`).
2. Open your PostgreSQL database using Prisma Studio or your preferred SQL client:
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
