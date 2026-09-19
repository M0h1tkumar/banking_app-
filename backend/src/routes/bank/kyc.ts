import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_change_in_prod';

// Combined Auth & RBAC Middleware
const authorizeBankOps = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    // Check if user is BANK_OPERATIONS
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || user.role !== 'BANK_OPERATIONS') {
      return res.status(403).json({ error: 'Forbidden: Requires Bank Operations role' });
    }
    
    req.userId = user.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

// GET all pending KYC applications
router.get('/pending', authorizeBankOps, async (req: any, res: any) => {
  try {
    const pendingKycs = await prisma.kycRecord.findMany({
      where: { status: 'SUBMITTED' },
      include: {
        user: {
          select: { id: true, email: true, status: true, createdAt: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    res.json(pendingKycs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending KYC records' });
  }
});

// APPROVE a KYC application
router.post('/:id/approve', authorizeBankOps, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    
    const kyc = await prisma.kycRecord.findUnique({ where: { id } });
    if (!kyc || kyc.status !== 'SUBMITTED') {
      return res.status(400).json({ error: 'KYC record not found or already processed' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update KYC record
      const updatedKyc = await tx.kycRecord.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedBy: req.userId
        }
      });

      // Update User status to ACTIVE
      await tx.user.update({
        where: { id: kyc.userId },
        data: { status: 'ACTIVE' }
      });

      // Update User's accounts to ACTIVE if they were PENDING
      await tx.account.updateMany({
        where: { userId: kyc.userId, status: 'PENDING' },
        data: { status: 'ACTIVE' }
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          actor: req.userId,
          action: 'KYC_APPROVED',
          entity: 'KycRecord',
          entityId: kyc.id,
          oldValue: JSON.stringify({ status: 'SUBMITTED' }),
          newValue: JSON.stringify({ status: 'APPROVED' })
        }
      });

      return updatedKyc;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve KYC' });
  }
});

// REJECT a KYC application
router.post('/:id/reject', authorizeBankOps, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const kyc = await prisma.kycRecord.findUnique({ where: { id } });
    if (!kyc || kyc.status !== 'SUBMITTED') {
      return res.status(400).json({ error: 'KYC record not found or already processed' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update KYC record
      const updatedKyc = await tx.kycRecord.update({
        where: { id },
        data: {
          status: 'REJECTED',
          reviewedAt: new Date(),
          reviewedBy: req.userId
        }
      });

      // Update User status to SUSPENDED
      await tx.user.update({
        where: { id: kyc.userId },
        data: { status: 'SUSPENDED' }
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          actor: req.userId,
          action: 'KYC_REJECTED',
          entity: 'KycRecord',
          entityId: kyc.id,
          oldValue: JSON.stringify({ status: 'SUBMITTED' }),
          newValue: JSON.stringify({ status: 'REJECTED', reason: reason || 'No reason provided' })
        }
      });

      return updatedKyc;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject KYC' });
  }
});

export default router;
