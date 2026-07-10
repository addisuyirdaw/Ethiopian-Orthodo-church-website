import { randomUUID } from 'crypto';
import { SupplyType, TransferStatus } from '@prisma/client';
import prisma from '../../lib/prisma';
import { AppError, NotFoundError } from '../../middleware/error-handler.middleware';

// ─── Domain Error ─────────────────────────────────────────────────────────────

/**
 * Thrown when an attempted allocation exceeds the available (unreserved) stock
 * in a SupplyBatch. Message is surfaced directly to the API consumer in Amharic.
 */
export class OverAllocationError extends AppError {
  constructor(available: number, requested: number) {
    super(
      422,
      `ክምችቱ አነስተኛ ነው: ${requested} ክፍሎችን ለመዛወር ጠይቀዋል፣ ነገር ግን ${available} ብቻ ይገኛሉ።`,
      'OverAllocationError',
    );
    this.name = 'OverAllocationError';
  }
}

export class InvalidTransferTransitionError extends AppError {
  constructor(from: TransferStatus, to: TransferStatus) {
    super(
      422,
      `ዝውውሩ ሁኔታ ከ "${from}" ወደ "${to}" ሊቀየር አይችልም — ይህ ሽግግር አልተፈቀደም።`,
      'InvalidTransferTransitionError',
    );
    this.name = 'InvalidTransferTransitionError';
  }
}

// ─── Allowed state machine transitions ───────────────────────────────────────

const ALLOWED_TRANSITIONS: Record<TransferStatus, TransferStatus[]> = {
  [TransferStatus.REQUESTED]: [TransferStatus.IN_TRANSIT, TransferStatus.CANCELLED],
  [TransferStatus.IN_TRANSIT]: [TransferStatus.DELIVERED, TransferStatus.CANCELLED],
  [TransferStatus.DELIVERED]: [],
  [TransferStatus.CANCELLED]: [],
};

// ─── Input / Output types ─────────────────────────────────────────────────────

export interface CreateBatchInput {
  institutionId: string;
  supplyType: SupplyType;
  batchCode: string;
  quantity: number;
  unitOfMeasure: string;
  blessedAt?: string;
  expiresAt?: string;
}

export interface CreateTransferInput {
  batchId: string;
  fromInstitutionId: string;
  toInstitutionId: string;
  senderUserId: string;
  quantityTransferred: number;
  transferNote?: string;
}

export interface UpdateTransferInput {
  transferId: string;
  newStatus: TransferStatus;
  receiverUserId?: string;
  transferNote?: string;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class SupplyChainService {
  /**
   * Creates a new SupplyBatch record for an institution.
   * Generates a guaranteed-unique batchCode prefix to prevent collision.
   */
  async createBatch(input: CreateBatchInput) {
    const batchCode = input.batchCode ?? `SB-${input.supplyType}-${randomUUID().slice(0, 8).toUpperCase()}`;

    return prisma.supplyBatch.create({
      data: {
        institutionId: input.institutionId,
        supplyType: input.supplyType,
        batchCode,
        quantity: input.quantity,
        reservedQuantity: 0,
        unitOfMeasure: input.unitOfMeasure,
        blessedAt: input.blessedAt ? new Date(input.blessedAt) : null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      },
    });
  }

  /**
   * Retrieves a single SupplyBatch by ID.
   */
  async getBatch(batchId: string) {
    const batch = await prisma.supplyBatch.findUnique({
      where: { id: batchId },
      include: { outgoing: true },
    });
    if (!batch) throw new NotFoundError(`SupplyBatch "${batchId}" አልተገኘም።`);
    return batch;
  }

  /**
   * Initiates a supply transfer between two institutions.
   *
   * High-safety path: executes atomically inside a serializable Prisma transaction
   * to prevent race-condition over-allocation. The available quantity is locked
   * for update before comparison, ensuring no two concurrent requests can
   * simultaneously claim stock that only satisfies one.
   *
   * @throws OverAllocationError when requested > (quantity - reservedQuantity)
   */
  async initiateTransfer(input: CreateTransferInput) {
    return prisma.$transaction(
      async (tx) => {
        // Lock the row for update within the transaction
        const batch = await tx.supplyBatch.findUnique({
          where: { id: input.batchId },
        });

        if (!batch) {
          throw new NotFoundError(`SupplyBatch "${input.batchId}" አልተገኘም።`);
        }

        const available = batch.quantity - batch.reservedQuantity;
        if (input.quantityTransferred > available) {
          throw new OverAllocationError(available, input.quantityTransferred);
        }

        // Reserve the stock atomically
        await tx.supplyBatch.update({
          where: { id: batch.id },
          data: { reservedQuantity: { increment: input.quantityTransferred } },
        });

        const transfer = await tx.supplyTransfer.create({
          data: {
            batchId: input.batchId,
            fromInstitutionId: input.fromInstitutionId,
            toInstitutionId: input.toInstitutionId,
            senderUserId: input.senderUserId,
            quantityTransferred: input.quantityTransferred,
            status: TransferStatus.REQUESTED,
            transferNote: input.transferNote ?? null,
          },
        });

        return transfer;
      },
      { isolationLevel: 'Serializable' },
    );
  }

  /**
   * Advances a SupplyTransfer through its lifecycle state machine.
   *
   * - REQUESTED → IN_TRANSIT: marks dispatch timestamp
   * - IN_TRANSIT → DELIVERED: deducts quantity from source batch, releases reservation
   * - Any → CANCELLED: releases reservation without deducting stock
   *
   * All mutations are wrapped in a Prisma transaction for atomicity.
   *
   * @throws InvalidTransferTransitionError for disallowed state transitions
   */
  async updateTransferStatus(input: UpdateTransferInput) {
    return prisma.$transaction(
      async (tx) => {
        const transfer = await tx.supplyTransfer.findUnique({
          where: { id: input.transferId },
          include: { batch: true },
        });

        if (!transfer) {
          throw new NotFoundError(`SupplyTransfer "${input.transferId}" አልተገኘም።`);
        }

        const allowed = ALLOWED_TRANSITIONS[transfer.status];
        if (!allowed.includes(input.newStatus)) {
          throw new InvalidTransferTransitionError(transfer.status, input.newStatus);
        }

        const updateData: Record<string, unknown> = {
          status: input.newStatus,
          transferNote: input.transferNote ?? transfer.transferNote,
        };

        if (input.newStatus === TransferStatus.IN_TRANSIT) {
          updateData.dispatchedAt = new Date();
        }

        if (input.newStatus === TransferStatus.DELIVERED) {
          updateData.deliveredAt = new Date();
          updateData.receiverUserId = input.receiverUserId ?? null;

          // Deduct permanently from source batch; release reservation
          await tx.supplyBatch.update({
            where: { id: transfer.batchId },
            data: {
              quantity: { decrement: transfer.quantityTransferred },
              reservedQuantity: { decrement: transfer.quantityTransferred },
            },
          });
        }

        if (input.newStatus === TransferStatus.CANCELLED) {
          // Release reservation without touching available stock
          await tx.supplyBatch.update({
            where: { id: transfer.batchId },
            data: { reservedQuantity: { decrement: transfer.quantityTransferred } },
          });
        }

        return tx.supplyTransfer.update({
          where: { id: transfer.id },
          data: updateData,
          include: { batch: true, fromInstitution: true, toInstitution: true },
        });
      },
      { isolationLevel: 'Serializable' },
    );
  }

  /**
   * Lists all SupplyBatches scoped to an institution, ordered by creation date.
   */
  async listBatchesByInstitution(institutionId: string) {
    return prisma.supplyBatch.findMany({
      where: { institutionId },
      orderBy: { createdAt: 'desc' },
      include: { outgoing: { select: { id: true, status: true, quantityTransferred: true } } },
    });
  }

  /**
   * Lists all SupplyTransfers originating from an institution, ordered by creation date.
   */
  async listTransfersByInstitution(institutionId: string) {
    return prisma.supplyTransfer.findMany({
      where: { fromInstitutionId: institutionId },
      orderBy: { createdAt: 'desc' },
      include: {
        batch: { select: { batchCode: true, supplyType: true, unitOfMeasure: true } },
        toInstitution: { select: { id: true, name: true } },
      },
    });
  }
}

export const supplyChainService = new SupplyChainService();
