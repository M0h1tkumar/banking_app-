import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

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

const transferSchema = z.object({
  fromAccountId: z.string().uuid(),
  toAccountNumber: z.string(),
  amount: z.number().positive(),
  description: z.string().optional()
});

router.post('/', authenticate, async (req: any, res: any) => {
  try {
    const { fromAccountId, toAccountNumber, amount, description } = transferSchema.parse(req.body);

    // 1. Verify sender owns the fromAccount
    const senderAccount = await prisma.account.findFirst({
      where: { id: fromAccountId, userId: req.userId }
    });

    if (!senderAccount) {
      return res.status(403).json({ error: 'Sender account not found or unauthorized' });
    }

    if (parseFloat(senderAccount.balance.toString()) < amount) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    // 2. Find receiver account
    const receiverAccount = await prisma.account.findUnique({
      where: { accountNumber: toAccountNumber }
    });

    if (!receiverAccount) {
      return res.status(404).json({ error: 'Destination account number not found' });
    }

    // 3. Execute atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // Debit sender
      const updatedSender = await tx.account.update({
        where: { id: senderAccount.id },
        data: { balance: { decrement: amount } }
      });

      // Credit receiver
      const updatedReceiver = await tx.account.update({
        where: { id: receiverAccount.id },
        data: { balance: { increment: amount } }
      });

      const referenceId = 'TXN' + Date.now() + Math.floor(Math.random() * 1000);

      // Create transfer record
      const transfer = await tx.transfer.create({
        data: {
          referenceId,
          amount,
          status: 'COMPLETED',
          senderAccountId: senderAccount.id,
          receiverAccountId: receiverAccount.id
        }
      });

      // Create transaction logs for both accounts (for statement view)
      await tx.transaction.create({
        data: {
          accountId: senderAccount.id,
          type: 'TRANSFER_OUT',
          amount,
          balanceAfter: updatedSender.balance,
          description: description || `Transfer to ${toAccountNumber}`,
          referenceId
        }
      });

      await tx.transaction.create({
        data: {
          accountId: receiverAccount.id,
          type: 'TRANSFER_IN',
          amount,
          balanceAfter: updatedReceiver.balance,
          description: description || `Transfer from ${senderAccount.accountNumber}`,
          referenceId
        }
      });

      return transfer;
    });

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error during transfer' });
  }
});

router.get('/:accountId', authenticate, async (req: any, res: any) => {
  try {
    const { accountId } = req.params;
    
    // Verify ownership
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId: req.userId }
    });

    if (!account) return res.status(403).json({ error: 'Unauthorized' });

    // Get transfers where user is sender OR receiver
    const transfers = await prisma.transfer.findMany({
      where: {
        OR: [
          { senderAccountId: accountId },
          { receiverAccountId: accountId }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(transfers);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
