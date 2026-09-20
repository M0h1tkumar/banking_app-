import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters long'),
});

router.post('/', async (req: any, res: any) => {
  try {
    const validatedData = contactSchema.parse(req.body);

    const message = await prisma.contactMessage.create({
      data: validatedData
    });

    res.status(201).json({ success: true, message: 'Message sent successfully!', data: message });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error(error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
