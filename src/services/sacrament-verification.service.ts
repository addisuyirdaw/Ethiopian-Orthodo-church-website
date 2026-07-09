import { createHash } from 'crypto';
import { SacramentalRecord } from '@prisma/client';
import { sacramentalRecordRepository } from '../repositories/sacramental-record.repository';
import { clergyValidationService } from './clergy-validation.service';
import { NotFoundError } from '../middleware/error-handler.middleware';
import { getEthiopicDate, formatIsoDate, parseIsoDate } from '../lib/calendar-utils';

export interface VerificationResult {
  status: 'VERIFIED';
  recordId: string;
  cryptographicSeal: string;
  canonicalMetadata: {
    celebrantVerified: boolean;
    calendars: {
      gregorian: string;
      ethiopic: string;
    };
  };
}

/**
 * Produces a deterministic SHA-256 seal over the four immutable core fields of
 * a sacramental record: id, type, christianName, eventDateUtc (ISO string).
 */
function computeCryptographicSeal(record: SacramentalRecord): string {
  const payload = [
    record.id,
    record.type,
    record.christianName,
    record.eventDateUtc.toISOString(),
  ].join('|');

  return createHash('sha256').update(payload, 'utf8').digest('hex');
}

export class SacramentVerificationService {
  /**
   * Fetches a sacramental record by ID, validates the celebrant's canonical
   * authority on the event date, computes the SHA-256 seal, and returns a
   * structured verification response.
   */
  async verify(recordId: string): Promise<VerificationResult> {
    const record = await sacramentalRecordRepository.findById(recordId);
    if (!record) {
      throw new NotFoundError('Sacramental record not found.');
    }

    // Validate that the celebrant priest held a canonical assignment
    // at the record's institution on the event date.
    const celebrantVerified = await clergyValidationService
      .validateCanonicalAuthority(
        record.celebrantPriestId,
        record.institutionId,
        record.eventDateUtc,
      )
      .then(() => true)
      .catch(() => false);

    const cryptographicSeal = computeCryptographicSeal(record);

    // Build dual-calendar metadata for the response.
    const gregorianIso = record.eventDateUtc.toISOString().slice(0, 10);
    const eventDate = parseIsoDate(gregorianIso);
    const ethiopic = getEthiopicDate(eventDate);
    const ethiopicIso = formatIsoDate(ethiopic.year, ethiopic.month, ethiopic.day);

    return {
      status: 'VERIFIED',
      recordId: record.id,
      cryptographicSeal,
      canonicalMetadata: {
        celebrantVerified,
        calendars: {
          gregorian: gregorianIso,
          ethiopic: ethiopicIso,
        },
      },
    };
  }
}

export const sacramentVerificationService = new SacramentVerificationService();
