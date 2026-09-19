import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_change_in_prod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

router.post('/register', async (req, res) => {
  try {
    const { email, password } = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
      }
    });

    // Create a default savings account for the new user
    await prisma.account.create({
      data: {
        userId: user.id,
        accountNumber: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
        type: 'SAVINGS',
        balance: 500, // Giving them $500 signup bonus so it's not empty!
      }
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });
    
    // Send cookie if we were doing cookies, but we will send token in body for now
    res.status(201).json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Invalid request data' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = registerSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    res.status(400).json({ error: 'Invalid request data' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        accounts: true
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Return safe user data
    res.json({
      id: user.id,
      email: user.email,
      status: user.status,
      accounts: user.accounts
    });
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

export default router;
