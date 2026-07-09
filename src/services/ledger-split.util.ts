import { InstitutionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { SPLIT_PERCENTAGES, toDecimal } from '../lib/decimal';

export interface SplitAllocation {
  institutionId: string;
  amount: Decimal;
  percentageApplied: Decimal;
}

export interface SplitTargetInstitution {
  id: string;
  type: InstitutionType;
  hierarchyPath: string;
}

export function parseHierarchyPath(hierarchyPath: string): string[] {
  return hierarchyPath.split('/').filter((segment) => segment.length > 0);
}

function isLeafInstitution(type: InstitutionType): boolean {
  return type === InstitutionType.PARISH || type === InstitutionType.MONASTERY;
}

/**
 * Calculates hierarchical fund splits:
 * - Parish/Monastery: 90% target, 7% immediate parent, 3% patriarchate
 * - Diocese/Archdiocese: 97% target, 3% patriarchate
 * - Patriarchate: 100% target
 */
export function calculateHierarchicalSplits(
  targetInstitution: SplitTargetInstitution,
  totalAmount: number | Decimal,
): SplitAllocation[] {
  const amount = toDecimal(totalAmount);
  const pathIds = parseHierarchyPath(targetInstitution.hierarchyPath);

  if (pathIds.length === 0) {
    throw new Error('Invalid hierarchy path: no institution segments found.');
  }

  if (targetInstitution.type === InstitutionType.PATRIARCHATE) {
    return [
      {
        institutionId: targetInstitution.id,
        amount,
        percentageApplied: SPLIT_PERCENTAGES.FULL,
      },
    ];
  }

  const patriarchateId = pathIds[0];
  const allocations: SplitAllocation[] = [];

  const patriarchateAmount = amount.mul(SPLIT_PERCENTAGES.PATRIARCHATE);
  allocations.push({
    institutionId: patriarchateId,
    amount: patriarchateAmount,
    percentageApplied: SPLIT_PERCENTAGES.PATRIARCHATE,
  });

  if (isLeafInstitution(targetInstitution.type) && pathIds.length >= 2) {
    const parentId = pathIds[pathIds.length - 2];
    const parentAmount = amount.mul(SPLIT_PERCENTAGES.IMMEDIATE_PARENT);
    const targetAmount = amount.mul(SPLIT_PERCENTAGES.TARGET_LEAF);

    allocations.push({
      institutionId: parentId,
      amount: parentAmount,
      percentageApplied: SPLIT_PERCENTAGES.IMMEDIATE_PARENT,
    });
    allocations.push({
      institutionId: targetInstitution.id,
      amount: targetAmount,
      percentageApplied: SPLIT_PERCENTAGES.TARGET_LEAF,
    });
  } else {
    const targetAmount = amount.mul(SPLIT_PERCENTAGES.TARGET_REGIONAL);
    allocations.push({
      institutionId: targetInstitution.id,
      amount: targetAmount,
      percentageApplied: SPLIT_PERCENTAGES.TARGET_REGIONAL,
    });
  }

  return allocations;
}

export function validateSplitBalance(
  totalAmount: Decimal,
  allocations: SplitAllocation[],
): boolean {
  const allocated = allocations.reduce(
    (sum, allocation) => sum.add(allocation.amount),
    new Decimal(0),
  );
  return allocated.equals(totalAmount);
}
