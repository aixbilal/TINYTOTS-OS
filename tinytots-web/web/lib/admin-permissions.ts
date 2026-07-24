export type AdminRole = "admin" | "order_manager" | "support" | "inventory_only";

export const ROLE_PERMISSIONS: Record<AdminRole, {
  canManageTeam: boolean;
  canManageOrders: boolean;
  canManageInventory: boolean;
  canManageDiscounts: boolean;
  canManageCoupons: boolean;
  canManageReferrals: boolean;
  canHandleComplaints: boolean;
}> = {
  admin: {
    canManageTeam: true,
    canManageOrders: true,
    canManageInventory: true,
    canManageDiscounts: true,
    canManageCoupons: true,
    canManageReferrals: true,
    canHandleComplaints: true,
  },
  order_manager: {
    canManageTeam: false,
    canManageOrders: true,
    canManageInventory: false,
    canManageDiscounts: false,
    canManageCoupons: false,
    canManageReferrals: false,
    canHandleComplaints: false,
  },
  support: {
    canManageTeam: false,
    canManageOrders: false,
    canManageInventory: false,
    canManageDiscounts: false,
    canManageCoupons: false,
    canManageReferrals: false,
    canHandleComplaints: true,
  },
  inventory_only: {
    canManageTeam: false,
    canManageOrders: false,
    canManageInventory: true,
    canManageDiscounts: false,
    canManageCoupons: false,
    canManageReferrals: false,
    canHandleComplaints: false,
  },
};

export function can(role: AdminRole | undefined, permission: keyof typeof ROLE_PERMISSIONS["admin"]) {
  if (!role) return false;
  return ROLE_PERMISSIONS[role][permission];
}