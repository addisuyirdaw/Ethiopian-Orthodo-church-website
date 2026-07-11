import { Request, Response } from 'express';
import { artifactService } from '../services/logistics/artifact.service';
import { estateService } from '../services/logistics/estate.service';
import {
  createArtifactSchema,
  createMonasticEstateSchema,
  createArtifactInspectionSchema,
} from '../validators/artifacts-estates.validator';
import { ForbiddenError } from '../middleware/error-handler.middleware';
import { EcclesiasticalRole } from '@prisma/client';
import { isAdministrativeRole } from '../types';
import { assertInstitutionAccess } from '../middleware/tenant-rbac.middleware';

// ─── Ecclesiastical Role Validation Helpers ──────────────────────────────────

const CLERGY_ROLES: readonly EcclesiasticalRole[] = [
  EcclesiasticalRole.PATRIARCH,
  EcclesiasticalRole.ARCHBISHOP,
  EcclesiasticalRole.METROPOLITAN,
  EcclesiasticalRole.BISHOP,
  EcclesiasticalRole.PRIEST,
];

const EPISCOPAL_ROLES: readonly EcclesiasticalRole[] = [
  EcclesiasticalRole.PATRIARCH,
  EcclesiasticalRole.ARCHBISHOP,
  EcclesiasticalRole.METROPOLITAN,
  EcclesiasticalRole.BISHOP,
];

function assertClergyRole(role: EcclesiasticalRole, locale: 'en' | 'am' | 'gez'): void {
  if (!(CLERGY_ROLES as readonly string[]).includes(role)) {
    const msgs = {
      en: 'Ecclesiastical role violation: Priest or higher role required.',
      am: 'ይህ አካሄድ ለካህናት እና ከዚያ በላይ ላሉ የክህነት ማዕረጎች ብቻ የተፈቀደ ነው።',
      gez: 'ዝንቱ ተግባር ለቀሳውስት ወለላዕልናሆሙ ዘተፈቅደ ውእቱ።',
    };
    throw new ForbiddenError(msgs[locale]);
  }
}

function assertEpiscopalRole(role: EcclesiasticalRole, locale: 'en' | 'am' | 'gez'): void {
  if (!(EPISCOPAL_ROLES as readonly string[]).includes(role)) {
    const msgs = {
      en: 'Ecclesiastical role violation: Episcopal role (Bishop or higher) required.',
      am: 'ይህ አካሄድ ለጳጳሳት እና ከዚያ በላይ ለሆኑ የላቀ የክህነት ማዕረጎች ብቻ የተፈቀደ ነው።',
      gez: 'ዝንቱ ተግባር ለጳጳሳት ወለላዕልናሆሙ ዘተፈቅደ ውእቱ።',
    };
    throw new ForbiddenError(msgs[locale]);
  }
}

// ─── Localized Success Messages Helper ────────────────────────────────────────

function getLocalizedMessage(
  key: 'artifact_created' | 'artifact_inspected' | 'estate_created',
  locale: 'en' | 'am' | 'gez'
): string {
  const messages: Record<typeof key, { en: string; am: string; gez: string }> = {
    artifact_created: {
      en: 'Sacred artifact registered successfully.',
      am: 'ቅዱስ ቅርስ በተሳካ ሁኔታ ተመዝግቧል።',
      gez: 'ቅዱስ ቅርስ በሰላም ተመዝግበ።',
    },
    artifact_inspected: {
      en: 'Artifact inspection logged successfully.',
      am: 'የቅርስ ፍተሻ ማስታወሻ በተሳካ ሁኔታ ተመዝግቧል።',
      gez: 'ዕቅበተ ቅርስ በሰላም ተመዝግበ።',
    },
    estate_created: {
      en: 'Monastic estate registered successfully.',
      am: 'የገዳም ርስት በተሳካ ሁኔታ ተመዝግቧል።',
      gez: 'ርስተ ገዳም በሰላም ተመዝግበ።',
    },
  };
  return messages[key][locale];
}

export class ArtifactsEstatesController {
  /**
   * POST /api/v1/logistics/artifacts
   * Register a new historical artifact profile. Clergy role required.
   */
  async registerArtifact(req: Request, res: Response): Promise<void> {
    const locale = req.locale || 'en';
    const user = req.user!;

    // 1. Gate: must be clergy
    assertClergyRole(user.ecclesiasticalRole, locale);

    // 2. Parse request body
    const input = createArtifactSchema.parse(req.body);
    const institutionId = input.institutionId ?? user.institutionId;

    // 3. Multitenancy guard: if modifying another institution, must be administrator
    if (institutionId !== user.institutionId) {
      if (!isAdministrativeRole(user.ecclesiasticalRole)) {
        const msgs = {
          en: 'You are not authorized to manage other institutions.',
          am: 'ሌሎች ተቋሞችን ለማስተዳደር ሥልጣን የለዎትም።',
          gez: 'አልብከ ሥልጣን ከመ ታስተዳድር ባዕዳነ አድባራት።',
        };
        throw new ForbiddenError(msgs[locale]);
      }
      await assertInstitutionAccess(user, institutionId, false);
    }

    // 4. Delegate to service
    const artifact = await artifactService.registerArtifact(user, input);

    res.status(201).json({
      data: artifact,
      message: getLocalizedMessage('artifact_created', locale),
    });
  }

  /**
   * GET /api/v1/logistics/artifacts
   * Fetch all active artifacts scoped to the caller's authorized institution.
   */
  async listArtifacts(req: Request, res: Response): Promise<void> {
    const user = req.user!;
    const institutionId = req.resolvedInstitutionId ?? user.institutionId;

    const artifacts = await artifactService.listArtifacts(institutionId);
    res.status(200).json({ data: artifacts });
  }

  /**
   * POST /api/v1/logistics/artifacts/:id/inspect
   * Log an inspection entry and update artifact condition. Clergy role required.
   */
  async logArtifactInspection(req: Request, res: Response): Promise<void> {
    const locale = req.locale || 'en';
    const user = req.user!;
    const { id: artifactId } = req.params;

    // 1. Gate: must be clergy
    assertClergyRole(user.ecclesiasticalRole, locale);

    // 2. Parse request body
    const input = createArtifactInspectionSchema.parse(req.body);

    // 3. Delegate to service
    const result = await artifactService.logInspection(user, artifactId, input);

    res.status(201).json({
      data: result,
      message: getLocalizedMessage('artifact_inspected', locale),
    });
  }

  /**
   * POST /api/v1/logistics/estates
   * Register GPS-bounded monastic land charts. Episcopal role required.
   */
  async registerEstate(req: Request, res: Response): Promise<void> {
    const locale = req.locale || 'en';
    const user = req.user!;

    // 1. Gate: must be episcopal (Bishop+)
    assertEpiscopalRole(user.ecclesiasticalRole, locale);

    // 2. Parse request body
    const input = createMonasticEstateSchema.parse(req.body);
    const institutionId = input.institutionId ?? user.institutionId;

    // 3. Multitenancy guard
    if (institutionId !== user.institutionId) {
      if (!isAdministrativeRole(user.ecclesiasticalRole)) {
        const msgs = {
          en: 'You are not authorized to manage other institutions.',
          am: 'ሌሎች ተቋሞችን ለማስተዳደር ሥልጣን የለዎትም።',
          gez: 'አልብከ ሥልጣን ከመ ታስተዳድር ባዕዳነ አድባራት።',
        };
        throw new ForbiddenError(msgs[locale]);
      }
      await assertInstitutionAccess(user, institutionId, false);
    }

    // 4. Delegate to service
    const estate = await estateService.registerEstate(user, input);

    res.status(201).json({
      data: estate,
      message: getLocalizedMessage('estate_created', locale),
    });
  }

  /**
   * GET /api/v1/logistics/estates
   * Fetch all registered monastic estates scoped to the caller's authorized institution.
   */
  async listEstates(req: Request, res: Response): Promise<void> {
    const user = req.user!;
    const institutionId = req.resolvedInstitutionId ?? user.institutionId;

    const estates = await estateService.listEstates(institutionId);
    res.status(200).json({ data: estates });
  }
}

export const artifactsEstatesController = new ArtifactsEstatesController();
