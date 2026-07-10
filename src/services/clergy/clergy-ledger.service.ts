import { CanonicalStatus } from '@prisma/client';
import prisma from '../../lib/prisma';
import { CanonicalStatusException } from '../../middleware/error-handler.middleware';

export class ClergyLedgerService {
  /**
   * Verifies that the given clergy holds active good standing status.
   * Parameter clergyId can represent either the ClergyProfile UUID or the linked User UUID.
   *
   * Throws `CanonicalStatusException` with localized Amharic-first error payloads on failure.
   */
  async verifyClergySacramentalAuthority(clergyId: string): Promise<boolean> {
    const profile = await prisma.clergyProfile.findFirst({
      where: {
        OR: [
          { id: clergyId },
          { userId: clergyId },
        ],
      },
    });

    if (!profile) {
      throw new CanonicalStatusException('ይህ የክህነት መታወቂያ በስርዓቱ ውስጥ አልተገኘም፤ እባክዎ እንደገና ያረጋግጡ።');
    }

    if (profile.canonicalStatus !== CanonicalStatus.ACTIVE_GOOD_STANDING) {
      switch (profile.canonicalStatus) {
        case CanonicalStatus.SUSPENDED:
          throw new CanonicalStatusException('ቀኖናዊ ክልከላ፡ ይህ አገልጋይ ዕገዳ ያለበት በመሆኑ ምስጢራትን የመፈጸም መንፈሳዊ ሥልጣን የለውም።');
        case CanonicalStatus.RETIRED:
          throw new CanonicalStatusException('ይህ አገልጋይ በዕድሜ ወይም በጤና ምክንያት የአገልግሎት ጡረታ የወጣ በመሆኑ ምስጢራትን የመፈጸም ሥልጣኑ ንቁ አይደለም።');
        case CanonicalStatus.LAICIZED:
          throw new CanonicalStatusException('ቀኖናዊ እገዳ፡ ይህ አገልጋይ ከክህነት ማዕረጉ የወረደ (የተሻረ) በመሆኑ ምስጢራትን የመፈጸም መንፈሳዊ ሥልጣን የለውም።');
        default:
          throw new CanonicalStatusException('ይህ አገልጋይ ምስጢራትን የመፈጸም መንፈሳዊ ሥልጣን የለውም።');
      }
    }

    return true;
  }
}

export const clergyLedgerService = new ClergyLedgerService();
