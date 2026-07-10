import { Request, Response } from 'express';
import { z } from 'zod';
import {
  generateSacramentSeal,
  verifyExternalSeal,
} from '../services/vault/crypto-seal.service';

const verifySealBodySchema = z.object({
  recordId: z.string().uuid('recordId must be a valid UUID.'),
  signature: z
    .string()
    .min(64, 'signature must be a hex-encoded RSA signature.')
    .regex(/^[0-9a-fA-F]+$/, 'signature must be a hexadecimal string.'),
});

export class VaultController {
  /**
   * POST /api/v1/vault/seal/:recordId
   * Authenticated (priest+). Generates and persists an RSA-PSS-SHA256 seal
   * for the specified sacramental record.
   */
  async sealRecord(req: Request, res: Response): Promise<void> {
    const { recordId } = req.params;
    const authorizerId = req.user!.id;

    const result = await generateSacramentSeal(recordId, authorizerId);

    res.status(201).json({
      data: {
        sealId: result.sealId,
        recordId: result.recordId,
        payloadHash: result.payloadHash,
        signature: result.signature,
        algorithm: result.algorithm,
        sealedAt: result.sealedAt,
      },
      message:
        'Cryptographic seal generated. This record is now permanently locked against mutation.',
    });
  }

  /**
   * POST /api/v1/vault/verify-seal
   * PUBLIC — no authentication required.
   * Verifies the RSA-PSS signature for a sacramental record and returns
   * the canonical record data if verification succeeds.
   */
  async verifyPublic(req: Request, res: Response): Promise<void> {
    const body = verifySealBodySchema.parse(req.body);
    const result = await verifyExternalSeal(body.recordId, body.signature);

    const status = result.verified ? 200 : 400;
    res.status(status).json({
      verified: result.verified,
      data: result.verified
        ? {
            recordId: result.recordId,
            christianName: result.christianName,
            sacramentType: result.sacramentType,
            institutionName: result.institutionName,
            eventDateGregorian: result.eventDateGregorian,
            eventDateEthiopic: result.eventDateEthiopic,
            payloadHash: result.payloadHash,
            sealedAt: result.sealedAt,
          }
        : null,
      message: result.verified
        ? 'Signature verified. This record is authentic and has not been tampered with.'
        : 'Signature verification failed. The record data or signature is invalid.',
    });
  }
}

export const vaultController = new VaultController();
