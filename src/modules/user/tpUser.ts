export const userRolesList = [
  "admin", "customer"
] as const;
export type tpUserRole = typeof userRolesList[number];
