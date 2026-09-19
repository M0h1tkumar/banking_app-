import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_change_in_prod';

const authenticate = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

// Helper to fetch statement data
const getStatementData = async (accountId: string, userId: string, fromDateStr?: string, toDateStr?: string) => {
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId }
  });

  if (!account) {
    throw new Error('Account not found or unauthorized');
  }

  // Parse dates, default to last 30 days if not provided
  const toDate = toDateStr ? new Date(toDateStr) : new Date();
  const fromDate = fromDateStr ? new Date(fromDateStr) : new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Validate range (max 12 months)
  const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays > 366) {
    throw new Error('Date range cannot exceed 12 months');
  }

  // Get all transactions for the account
  const transactions = await prisma.transaction.findMany({
    where: {
      accountId,
      createdAt: {
        gte: fromDate,
        lte: toDate
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  // Calculate opening balance (balance before the first transaction in range)
  // This requires fetching the last transaction BEFORE the fromDate
  const priorTransaction = await prisma.transaction.findFirst({
    where: {
      accountId,
      createdAt: { lt: fromDate }
    },
    orderBy: { createdAt: 'desc' }
  });

  // If no prior transactions, opening balance is 0. Otherwise, it's the balanceAfter of that prior txn.
  let openingBalance = priorTransaction ? parseFloat(priorTransaction.balanceAfter.toString()) : 0;
  
  // Calculate closing balance (balance after the last transaction in range)
  let closingBalance = transactions.length > 0 
    ? parseFloat(transactions[transactions.length - 1].balanceAfter.toString()) 
    : openingBalance;

  // Calculate totals
  let totalIn = 0;
  let totalOut = 0;
  
  transactions.forEach(t => {
    const amt = parseFloat(t.amount.toString());
    if (t.type === 'TRANSFER_IN') totalIn += amt;
    else if (t.type === 'TRANSFER_OUT') totalOut += amt;
  });

  return {
    accountNumber: account.accountNumber,
    currency: account.currency,
    period: { from: fromDate.toISOString(), to: toDate.toISOString() },
    openingBalance,
    closingBalance,
    totalInflow: totalIn,
    totalOutflow: totalOut,
    transactions
  };
};

router.get('/:accountId', authenticate, async (req: any, res: any) => {
  try {
    const { accountId } = req.params;
    const { from, to } = req.query;

    const statement = await getStatementData(accountId, req.userId, from as string, to as string);
    res.json(statement);
  } catch (error: any) {
    if (error.message.includes('Date range')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('not found')) {
      return res.status(403).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error generating statement' });
  }
});

router.get('/:accountId/download', authenticate, async (req: any, res: any) => {
  try {
    const { accountId } = req.params;
    const { from, to } = req.query;

    const statement = await getStatementData(accountId, req.userId, from as string, to as string);
    
    // Generate CSV
    let csvStr = `Date,Type,Description,Amount,Balance\n`;
    
    statement.transactions.forEach((t) => {
      const date = new Date(t.createdAt).toISOString().split('T')[0];
      const type = t.type === 'TRANSFER_IN' ? 'Credit' : 'Debit';
      const desc = `"${t.description.replace(/"/g, '""')}"`; // escape quotes
      const amount = parseFloat(t.amount.toString()).toFixed(2);
      const balance = parseFloat(t.balanceAfter.toString()).toFixed(2);
      
      csvStr += `${date},${type},${desc},${amount},${balance}\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment(`Statement_${statement.accountNumber}_${statement.period.from.split('T')[0]}_to_${statement.period.to.split('T')[0]}.csv`);
    return res.send(csvStr);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to download statement' });
  }
});

export default router;
