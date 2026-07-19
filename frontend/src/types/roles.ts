/**
 * RBAC Permission Matrix per Ethiopian Orthodox Tewahedo Church (Qale Awadi Constitution)
 * Section 2009 E.C. (4th Edition)
 */

export type AuthRole = 'MIMEN' | 'PRIEST' | 'PARISH_ADMIN' | 'SYSTEM_ADMIN';

export type EcclesiasticalRole = 
  | 'PATRIARCH'          // Highest spiritual authority
  | 'ARCHBISHOP'         // Regional spiritual leader
  | 'METROPOLITAN'       // Diocese spiritual leader
  | 'BISHOP'             // Parish spiritual leader
  | 'PRIEST'             // ቀሲስ - Celebrates sacraments
  | 'DEACON'             // ዲያቆን - Assists priest
  | 'LAITY';             // Regular follower (can pay/donate)

export type CouncilRole = 
  | 'LIQE_MENBER'        // Chairperson (Parish Council head)
  | 'MEK_LIQE_MENBER'    // Deputy Chairperson
  | 'WANA_TSEHAFI'       // Secretary
  | 'GENZEB_YAZHI'       // Accountant/Treasurer
  | 'HISAB_SHUM';        // Finance auditor

/**
 * Menu Visibility Permissions per Role
 * ✅ = Can access | ❌ = Cannot access
 */
export const PERMISSION_MATRIX = {
  'PATRIARCH': {
    viewPayments: false,          // ❌ Spiritual leaders don't pay/donate themselves
    makePayments: false,          // ❌
    viewDonations: false,         // ❌
    makeDonations: false,         // ❌
    approveDualAuth: true,        // ✅ Can approve financial decisions
    manageSacraments: true,       // ✅ Can verify sacraments
    viewDirectory: true,          // ✅
    viewFinancialReports: true,   // ✅ Read-only
    requestWithdrawals: false,    // ❌ Only via Secretary/Accountant
  },
  'ARCHBISHOP': {
    viewPayments: false,
    makePayments: false,
    viewDonations: false,
    makeDonations: false,
    approveDualAuth: true,
    manageSacraments: true,
    viewDirectory: true,
    viewFinancialReports: true,
    requestWithdrawals: false,
  },
  'METROPOLITAN': {
    viewPayments: false,
    makePayments: false,
    viewDonations: false,
    makeDonations: false,
    approveDualAuth: true,
    manageSacraments: true,
    viewDirectory: true,
    viewFinancialReports: true,
    requestWithdrawals: false,
  },
  'BISHOP': {
    viewPayments: false,          // ❌ KEY FIX: Bishops don't see payment options
    makePayments: false,          // ❌
    viewDonations: false,         // ❌
    makeDonations: false,         // ❌
    approveDualAuth: true,        // ✅ Can co-sign financial approvals
    manageSacraments: true,       // ✅ Spiritual authority
    viewDirectory: true,
    viewFinancialReports: true,
    requestWithdrawals: false,
  },
  'PRIEST': {
    viewPayments: false,          // ❌ Priests don't manage finances
    makePayments: false,
    viewDonations: false,
    makeDonations: false,
    approveDualAuth: false,       // ❌ Not in financial approval chain
    manageSacraments: true,       // ✅ Core priestly function
    viewDirectory: true,          // ✅ For pastoral care
    viewFinancialReports: false,  // ❌
    requestWithdrawals: false,
  },
  'DEACON': {
    viewPayments: false,
    makePayments: false,
    viewDonations: false,
    makeDonations: false,
    approveDualAuth: false,
    manageSacraments: true,       // ✅ Assists priest
    viewDirectory: true,
    viewFinancialReports: false,
    requestWithdrawals: false,
  },
  'LAITY': {
    viewPayments: true,           // ✅ KEY: Only followers see payments
    makePayments: true,           // ✅ Can pay tithes/church fees
    viewDonations: true,          // ✅ Can see donation campaigns
    makeDonations: true,          // ✅ Can donate
    approveDualAuth: false,       // ❌ Not in approval chain
    manageSacraments: false,      // ❌
    viewDirectory: true,          // ✅ Find spiritual fathers
    viewFinancialReports: false,  // ❌
    requestWithdrawals: false,    // ❌
  },
};

/**
 * Menu items visible per role
 */
export const ROLE_MENU_MAP = {
  'PATRIARCH': ['directory', 'sacraments', 'governance', 'reports', 'approvals'],
  'ARCHBISHOP': ['directory', 'sacraments', 'governance', 'reports', 'approvals'],
  'METROPOLITAN': ['directory', 'sacraments', 'governance', 'reports', 'approvals'],
  'BISHOP': ['directory', 'sacraments', 'governance', 'reports', 'approvals'],
  'PRIEST': ['directory', 'sacraments', 'counseling', 'confessions'],
  'DEACON': ['directory', 'sacraments', 'counseling'],
  'LAITY': ['payments', 'donations', 'directory', 'confessions', 'spiritual-children'],
};

/**
 * Which roles can dual-approve financial decisions
 */
export const DUAL_AUTH_ROLES = [
  'PATRIARCH', 'ARCHBISHOP', 'METROPOLITAN', 'BISHOP',
];

/**
 * Which roles have finance capabilities
 */
export const FINANCE_ROLES = [
  'GENZEB_YAZHI',    // Accountant
  'HISAB_SHUM',      // Finance auditor
];

export interface UserRole {
  ecclesiasticalRole: EcclesiasticalRole;
  authRole: AuthRole;
  councilRole?: CouncilRole;
  permissions: typeof PERMISSION_MATRIX[EcclesiasticalRole];
}
