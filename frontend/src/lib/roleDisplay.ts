export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  operator: 'Operator',
  viewer: 'Viewer',
  developer: 'Developer',
  super_admin: 'Platform Super Admin',
  user: 'Regular user',
};

export function getRoleDisplayName(role: string): string {
  return ROLE_DISPLAY_NAMES[role] || role;
}
