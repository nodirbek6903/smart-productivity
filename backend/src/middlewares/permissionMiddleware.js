exports.checkPermission = (...requiredPermissions) => {
    return (req,res,next) => {
        if(!req.user){
            return res.status(401).json({
                success:false,
                message:"Autentifikatsiya talab qilinadi"
            })
        }

        if(!req.user.role || !req.user.role.permissions){
            return res.status(403).json({
                success:false,
                message:"Rol malumotlari topilmadi"
            })
        }

        const userPermissions = req.user.role.permissions || []

        if(req.user.role.name === "ADMIN"){
            return next()
        }

        const hasPermission = requiredPermissions.some(permission => userPermissions.includes(permission))

        if(!hasPermission){
            return res.status(403).json({
                success:false,
                message:"Sizda bu amalni bajarish uchun ruxsat yo'q",
                requiredPermissions,
                yourPermissions:userPermissions
            })
        }
        next()
    }
}

exports.requireAllPermissions = (...requiredPermissions) => {
    return (req,res,next) => {
        if(!req.user || !req.user.role){
            return res.status(401).json({
                success:false,
                message:"Autentifikatiya talab qilinadi"
            })
        }

        const userPermissions = req.user.role.permissions || []

        if(req.user.role.name === "ADMIN"){
            return next()
        }

        const hasAllPermissions = requiredPermissions.every(permission => userPermissions.includes(permission))


        if(!hasAllPermissions){
            return res.status(403).json({
                success:false,
                message:"Sizda barcha kerakli ruxsatlar yo'q",
                requiredPermissions,
                missingPermissions:requiredPermissions.filter(p => !userPermissions.includes(p))
            })
        }
        next()
    }
}

exports.canModifyResource = (resourceOwnerField = "createdBy",permission) => {
    return (req,res,next) => {
        if(!req.user){
            return res.status(401).json({
        success: false,
        message: "Autentifikatsiya talab qilinadi"
      });
        }

        if(permission && req.user.role.permissions.includes(permission)){
            return next()
        }

        if(req.user.role.name === "ADMIN"){
            return next()
        }

        req.resourceOwnerField = resourceOwnerField;
        next()
    }
}

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