// Permission utility functions for role-based access control

export const hasPermission = (user, module, action) => {
  if (!user) return false;
  
  // Admin has all permissions
  if (user.role === 'admin') return true;
  
  // Check specific permission
  return user.permissions?.[module]?.[action] === true;
};

// Check if user has any of the specified permissions
export const hasAnyPermission = (user, permissions) => {
  if (!user) return false;
  
  // Admin has all permissions
  if (user.role === 'admin') return true;
  
  return permissions.some(({ module, action }) => 
    user.permissions?.[module]?.[action] === true
  );
};

// Get user's permissions for a specific module
export const getModulePermissions = (user, module) => {
  if (!user) return { create: false, read: false, update: false, delete: false };
  
  // Admin has all permissions
  if (user.role === 'admin') {
    return { create: true, read: true, update: true, delete: true };
  }
  
  return user.permissions?.[module] || { create: false, read: false, update: false, delete: false };
};

// Check if user can access a module (at least read permission)
export const canAccessModule = (user, module) => {
  return hasPermission(user, module, 'read');
};

// Default permissions for different roles
export const DEFAULT_PERMISSIONS = {
  admin: {
    donations: { create: true, read: true, update: true, delete: true },
    inventory: { create: true, read: true, update: true, delete: true },
    expenses: { create: true, read: true, update: true, delete: true },
    funds: { create: true, read: true, update: true, delete: true, allocate: true },
    events: { create: true, read: true, update: true, delete: true },
    users: { create: true, read: true, update: true, delete: true },
    reports: { read: true, export: true }
  },
  manager: {
    donations: { create: true, read: true, update: true, delete: false },
    inventory: { create: true, read: true, update: true, delete: false },
    expenses: { create: true, read: true, update: true, delete: false },
    funds: { create: false, read: true, update: false, delete: false, allocate: false },
    events: { create: true, read: true, update: true, delete: false },
    users: { create: false, read: true, update: false, delete: false },
    reports: { read: true, export: true }
  },
  volunteer: {
    donations: { create: true, read: true, update: false, delete: false },
    inventory: { create: true, read: true, update: true, delete: false },
    expenses: { create: true, read: true, update: false, delete: false },
    funds: { create: false, read: true, update: false, delete: false, allocate: false },
    events: { create: false, read: true, update: false, delete: false },
    users: { create: false, read: false, update: false, delete: false },
    reports: { read: true, export: false }
  },
  viewer: {
    donations: { create: false, read: true, update: false, delete: false },
    inventory: { create: false, read: true, update: false, delete: false },
    expenses: { create: false, read: true, update: false, delete: false },
    funds: { create: false, read: true, update: false, delete: false, allocate: false },
    events: { create: false, read: true, update: false, delete: false },
    users: { create: false, read: false, update: false, delete: false },
    reports: { read: true, export: false }
  }
};