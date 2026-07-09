import { clergyAssignmentRepository } from '../repositories/clergy-assignment.repository';
import { CanonicalValidationError } from '../middleware/error-handler.middleware';

export class ClergyValidationService {
  /**
   * Verifies that a priest holds an active canonical assignment at the given
   * institution on the specified date.
   *
   * Throws `CanonicalValidationError` if no active assignment covers that window.
   */
  async validateCanonicalAuthority(
    priestId: string,
    institutionId: string,
    date: Date,
  ): Promise<boolean> {
    const assignment = await clergyAssignmentRepository.findActiveAssignment(
      priestId,
      institutionId,
      date,
    );

    if (!assignment) {
      throw new CanonicalValidationError(
        'Priest does not hold canonical assignment at this institution for the specified date.',
      );
    }

    return true;
  }
}

export const clergyValidationService = new ClergyValidationService();
