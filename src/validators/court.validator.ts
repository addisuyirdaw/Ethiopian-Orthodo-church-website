import { z } from 'zod';
import { CaseType } from '@prisma/client';

// ── Create Canonical Case ─────────────────────────────────────────────────────

export const createCanonicalCaseSchema = z.object({
  caseType: z.nativeEnum(CaseType),
  partiesInvolved: z.string().min(3, 'Parties involved description is required.'),
  assignedMediatorUserId: z.string().uuid().optional(),
});

// ── List Cases (query params) ─────────────────────────────────────────────────

export const listCasesQuerySchema = z.object({
  caseType: z.nativeEnum(CaseType).optional(),
});

// ── Mutate Clergy Standing ────────────────────────────────────────────────────

import { CanonicalStanding } from '@prisma/client';

export const mutateStandingSchema = z.object({
  targetUserId: z.string().uuid('targetUserId must be a valid UUID.'),
  newStanding: z.nativeEnum(CanonicalStanding),
  reason: z.string().min(10, 'A canonical reason of at least 10 characters is required.'),
});
