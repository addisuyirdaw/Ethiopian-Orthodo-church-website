import { Router, Request, Response, NextFunction } from 'express';
import { ParishLedgerCategory, ParishPaymentMethod, TransactionStatus, TransactionType, PaymentGateway } from '@prisma/client';
import { gregorianToEthiopian } from '../utils/calendarConverter';
import prisma from '../lib/prisma';

const router = Router();

// Helper: convert cents to readable decimal string
function centsToDecimal(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * POST /api/finance/transactions
 * Record a contribution (tithe or offering).
 */
router.post('/transactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      parishId,
      parishionerId,
      amount,
      category,
      paymentMethod,
      referenceNumber,
      transactionDateGreg,
      notes,
      recordedById,
    } = req.body;

    // Basic validation
    if (!parishId) return res.status(400).json({ error: 'parishId required' });
    if (amount == null || isNaN(Number(amount))) return res.status(400).json({ error: 'Valid amount required' });
    if (!category) return res.status(400).json({ error: 'category required' });
    if (!paymentMethod) return res.status(400).json({ error: 'paymentMethod required' });
    if (!transactionDateGreg) return res.status(400).json({ error: 'transactionDateGreg required' });

    const amountInCents = Math.round(Number(amount) * 100);
    const transactionDate = new Date(transactionDateGreg);
    const transactionDateEth = gregorianToEthiopian(transactionDate);

    // Parish model uses its own id as institutional anchor
    const parish = await prisma.parish.findUnique({ where: { id: parishId } });
    if (!parish) return res.status(404).json({ error: 'Parish not found' });

    const newTx = await prisma.financialTransaction.create({
      data: {
        institutionId: parishId, // use parishId as tenantId until Institution FK is linked
        parishId,
        parishionerId: parishionerId || null,
        amountInCents,
        currency: 'ETB',
        category: category as ParishLedgerCategory,
        paymentMethod: paymentMethod as ParishPaymentMethod,
        referenceNumber: referenceNumber || null,
        transactionDateGreg: transactionDate,
        transactionDateEth,
        notes: notes || null,
        recordedById: recordedById || null,
        type: TransactionType.TITHE, // generic placeholder – callers may map based on category
        gateway: PaymentGateway.MANUAL_CASH, // placeholder mapping
        referenceId: referenceNumber || undefined,
        status: TransactionStatus.COMPLETED,
      },
    });

    res.status(201).json(newTx);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/finance/parishioners/:id/statement
 * Returns chronological transaction history and aggregates.
 */
router.get('/parishioners/:id/statement', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parishionerId = req.params.id;

    const transactions = await prisma.financialTransaction.findMany({
      where: { parishionerId },
      orderBy: { transactionDateGreg: 'asc' },
    });

    const totalAsratPaidInCents = transactions
      .filter((t) => t.category === 'ASRAT')
      .reduce((sum, t) => sum + (t.amountInCents ?? 0), 0);

    const totalDonationsPaidInCents = transactions
      .filter((t) => t.category !== 'ASRAT')
      .reduce((sum, t) => sum + (t.amountInCents ?? 0), 0);

    const grandTotalPaid = centsToDecimal(totalAsratPaidInCents + totalDonationsPaidInCents);

    res.json({
      transactions,
      summary: { totalAsratPaidInCents, totalDonationsPaidInCents, grandTotalPaid },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
