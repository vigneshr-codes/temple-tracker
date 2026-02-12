const checkPermission = (module, action) => {
  return (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. No user found.'
        });
      }

      // Admin has all permissions
      if (user.role === 'admin') {
        return next();
      }

      // Check if user has the specific permission
      const hasPermission = user.permissions && 
                           user.permissions[module] && 
                           user.permissions[module][action] === true;

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Access denied. You don't have permission to ${action} ${module}.`
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error checking permissions',
        error: error.message
      });
    }
  };
};

// Helper function to check multiple permissions (user needs at least one)
const checkAnyPermission = (permissions) => {
  return (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. No user found.'
        });
      }

      // Admin has all permissions
      if (user.role === 'admin') {
        return next();
      }

      // Check if user has any of the specified permissions
      const hasAnyPermission = permissions.some(({ module, action }) => {
        return user.permissions && 
               user.permissions[module] && 
               user.permissions[module][action] === true;
      });

      if (!hasAnyPermission) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.',
          required: permissions.map(p => `${p.module}:${p.action}`),
          userRole: user.role
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error checking permissions',
        error: error.message
      });
    }
  };
};

// Helper function to check if user has read access to any module (for navigation)
const hasAnyReadAccess = (user) => {
  if (!user || !user.permissions) return false;
  
  const modules = ['donations', 'inventory', 'expenses', 'funds', 'users', 'reports'];
  return modules.some(module => user.permissions[module]?.read === true);
};

module.exports = {
  checkPermission,
  checkAnyPermission,
  hasAnyReadAccess
};