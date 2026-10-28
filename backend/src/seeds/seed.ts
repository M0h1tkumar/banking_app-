import { PrismaClient, Role, KycStatus, AccountType, AccountStatus, TransactionType, TransactionStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo banking accounts...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Seed Bank Admin Account
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@neobank.com' },
    update: {
      role: Role.BANK_OPERATIONS,
      passwordHash,
    },
    create: {
      email: 'admin@neobank.com',
      passwordHash,
      role: Role.BANK_OPERATIONS,
    },
  });

  console.log(`✓ Admin account created: admin@neobank.com (Role: BANK_OPERATIONS)`);

  // 2. Seed Customer Account
  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@neobank.com' },
    update: {
      passwordHash,
      role: Role.CUSTOMER,
    },
    create: {
      email: 'customer@neobank.com',
      passwordHash,
      role: Role.CUSTOMER,
    },
  });

  // Approved KYC for demo customer
  await prisma.kycRecord.upsert({
    where: { userId: customerUser.id },
    update: {
      status: KycStatus.APPROVED,
      reviewedBy: adminUser.id,
      reviewedAt: new Date(),
    },
    create: {
      userId: customerUser.id,
      aadhaar: '1234-5678-9012',
      pan: 'ABCDE1234F',
      status: KycStatus.APPROVED,
      reviewedBy: adminUser.id,
      reviewedAt: new Date(),
    },
  });

  // Demo Savings Account
  const customerAccount = await prisma.account.upsert({
    where: { accountNumber: '1000000001' },
    update: {
      balance: 5000,
      status: AccountStatus.ACTIVE,
    },
    create: {
      userId: customerUser.id,
      accountNumber: '1000000001',
      type: AccountType.SAVINGS,
      status: AccountStatus.ACTIVE,
      balance: 5000,
      currency: 'INR',
    },
  });

  // Initial Demo Transaction
  const existingTx = await prisma.transaction.findFirst({
    where: { accountId: customerAccount.id }
  });

  if (!existingTx) {
    await prisma.transaction.create({
      data: {
        accountId: customerAccount.id,
        type: TransactionType.TRANSFER_IN,
        amount: 5000,
        balanceAfter: 5000,
        description: 'Initial Deposit & Welcome Bonus',
        status: TransactionStatus.COMPLETED,
      }
    });
  }

  console.log(`✓ Customer account created: customer@neobank.com (Savings Account: 1000000001, Balance: ₹5,000)`);
  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
