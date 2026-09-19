import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_change_in_prod';

// Auth middleware to inject user into request
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

const createAccountSchema = z.object({
  type: z.enum(['SAVINGS', 'CURRENT']),
});

// Create a new account
router.post('/', authenticate, async (req: any, res: any) => {
  try {
    const { type } = createAccountSchema.parse(req.body);
    
    // Generate a random 10 digit account number
    const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();

    const account = await prisma.account.create({
      data: {
        userId: req.userId,
        accountNumber,
        type,
        status: 'ACTIVE', // Defaulting to ACTIVE for easy testing
        balance: 0,
      }
    });

    res.status(201).json(account);
  } catch (error) {
    res.status(400).json({ error: 'Invalid request' });
  }
});

// List all accounts for user
router.get('/', authenticate, async (req: any, res: any) => {
  try {
    const accounts = await prisma.account.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'asc' }
    });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get specific account with transactions
router.get('/:id', authenticate, async (req: any, res: any) => {
  try {
    const account = await prisma.account.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    });

    if (!account) return res.status(404).json({ error: 'Account not found' });
    res.json(account);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
