exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Foydalanuvchi autentifikatsiya qilinmagan'
      });
    }

    const userRole = req.user.role.name;
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Sizda bu amalni bajarish huquqi yo\'q',
        requiredRoles: roles,
        yourRole: userRole
      });
    }

    next();
  };
};