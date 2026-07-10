import { Request, Response } from 'express';
import { supplyChainService } from '../services/logistics/supply-chain.service';
import {
  createSupplyBatchSchema,
  createSupplyTransferSchema,
  updateTransferStatusSchema,
} from '../validators/logistics.validator';
import { ForbiddenError } from '../middleware/error-handler.middleware';
import { isAdministrativeRole } from '../types';
import { assertInstitutionAccess } from '../middleware/tenant-rbac.middleware';

export class LogisticsController {
  /**
   * POST /api/v1/logistics/batches
   *
   * Creates a new sacramental supply batch. The batch is attributed to the
   * caller's institution unless an override `institutionId` is provided and
   * the caller has administrative cross-institution jurisdiction.
   */
  async createBatch(req: Request, res: Response): Promise<void> {
    const input = createSupplyBatchSchema.parse(req.body);
    const user = req.user!;

    const institutionId = input.institutionId ?? user.institutionId;

    if (institutionId !== user.institutionId) {
      if (!isAdministrativeRole(user.ecclesiasticalRole)) {
        throw new ForbiddenError('ሌሎች ተቋሞችን ለማስተዳደር ሥልጣን የለዎትም።');
      }
      await assertInstitutionAccess(user, institutionId, false);
    }

    const batch = await supplyChainService.createBatch({
      institutionId,
      supplyType: input.supplyType,
      batchCode: input.batchCode,
      quantity: input.quantity,
      unitOfMeasure: input.unitOfMeasure,
      blessedAt: input.blessedAt,
      expiresAt: input.expiresAt,
    });

    res.status(201).json({
      data: batch,
      message: 'የቁሳቁስ ቡድን በተሳካ ሁኔታ ተፈጥሯል።',
    });
  }

  /**
   * GET /api/v1/logistics/batches/:batchId
   *
   * Returns a single SupplyBatch record by ID. Caller must have access to the
   * owning institution.
   */
  async getBatch(req: Request, res: Response): Promise<void> {
    const user = req.user!;
    const { batchId } = req.params;

    const batch = await supplyChainService.getBatch(batchId);

    // Verify the caller has read access to the batch's institution
    await assertInstitutionAccess(user, batch.institutionId, false);

    res.status(200).json({ data: batch });
  }

  /**
   * GET /api/v1/logistics/batches
   *
   * Lists all SupplyBatches for the resolved institution. Supports optional
   * `?institution_id=` override for admin users (handled by tenantRbac
   * middleware which sets `req.resolvedInstitutionId`).
   */
  async listBatches(req: Request, res: Response): Promise<void> {
    const institutionId = req.resolvedInstitutionId ?? req.user!.institutionId;
    const batches = await supplyChainService.listBatchesByInstitution(institutionId);
    res.status(200).json({ data: batches });
  }

  /**
   * POST /api/v1/logistics/transfers
   *
   * Initiates a supply transfer from the caller's institution to another.
   * Atomically reserves stock using a serializable transaction.
   */
  async initiateTransfer(req: Request, res: Response): Promise<void> {
    const input = createSupplyTransferSchema.parse(req.body);
    const user = req.user!;

    const fromInstitutionId = user.institutionId;

    const transfer = await supplyChainService.initiateTransfer({
      batchId: input.batchId,
      fromInstitutionId,
      toInstitutionId: input.toInstitutionId,
      senderUserId: user.id,
      quantityTransferred: input.quantityTransferred,
      transferNote: input.transferNote,
    });

    res.status(201).json({
      data: transfer,
      message: 'የቁሳቁስ ዝውውር በተሳካ ሁኔታ ተጀምሯል።',
    });
  }

  /**
   * PATCH /api/v1/logistics/transfers/:transferId/status
   *
   * Advances a SupplyTransfer through its lifecycle state machine.
   * Only the receiving institution can confirm delivery; admin roles can
   * cancel from either side.
   */
  async updateTransferStatus(req: Request, res: Response): Promise<void> {
    const input = updateTransferStatusSchema.parse(req.body);
    const user = req.user!;
    const { transferId } = req.params;

    const transfer = await supplyChainService.updateTransferStatus({
      transferId,
      newStatus: input.status,
      receiverUserId: input.receiverUserId ?? user.id,
      transferNote: input.transferNote,
    });

    res.status(200).json({
      data: transfer,
      message: `የዝውውር ሁኔታ ወደ "${input.status}" ተቀይሯል።`,
    });
  }

  /**
   * GET /api/v1/logistics/transfers
   *
   * Lists SupplyTransfers originating from the resolved institution.
   */
  async listTransfers(req: Request, res: Response): Promise<void> {
    const institutionId = req.resolvedInstitutionId ?? req.user!.institutionId;
    const transfers = await supplyChainService.listTransfersByInstitution(institutionId);
    res.status(200).json({ data: transfers });
  }
}

export const logisticsController = new LogisticsController();
