import { useAuth } from '../context/AuthContext';
import { PERMISSION_MATRIX, type EcclesiasticalRole } from '../types/roles';

/**
 * Hook to check if the current user has permission for an action.
 *
 * Reads `ecclesiasticalRole` from AuthContext, which is populated from
 * the real backend JWT response field `ecclesiastical_role`.
 *
 * Usage:
 *   const { canViewPayments, canManageSacraments } = usePermission();
 */
export const usePermission = () => {
  const { ecclesiasticalRole } = useAuth();

  // ecclesiasticalRole from the backend (e.g. "PRIEST", "LAITY", "BISHOP")
  // must match the keys in PERMISSION_MATRIX exactly.
  const permissions = ecclesiasticalRole
    ? PERMISSION_MATRIX[ecclesiasticalRole as EcclesiasticalRole] ?? null
    : null;

  return {
    canViewPayments:        permissions?.viewPayments        ?? false,
    canMakePayments:        permissions?.makePayments        ?? false,
    canViewDonations:       permissions?.viewDonations       ?? false,
    canMakeDonations:       permissions?.makeDonations       ?? false,
    canApproveDualAuth:     permissions?.approveDualAuth     ?? false,
    canManageSacraments:    permissions?.manageSacraments    ?? false,
    canViewDirectory:       permissions?.viewDirectory       ?? false,
    canViewFinancialReports:permissions?.viewFinancialReports?? false,
    canRequestWithdrawals:  permissions?.requestWithdrawals  ?? false,
    allPermissions: permissions ?? null,
  };
};
