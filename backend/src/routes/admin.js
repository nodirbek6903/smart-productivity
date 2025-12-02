const express = require("express");
const router = express.Router();
const {
  getSystemStats,
  bulkActivateUsers,
  bulkDeactivateUsers,
  bulkDeleteUsers,
  getAllRoles,
  updateRole,
  getSystemSettings,
  cleanupInactiveUsers,
  cleanupOldAuditLogs
} = require("../controllers/adminController");

const { protect } = require("../middlewares/authMiddleware");
const { checkPermission } = require("../middlewares/permissionMiddleware");

router.use(protect);

router.get(
  "/stats",
  checkPermission("system:view-stats"),
  getSystemStats
);

router.post(
  "/users/bulk-activate",
  checkPermission("user:manage-roles"),
  bulkActivateUsers
);

router.post(
  "/users/bulk-deactivate",
  checkPermission("user:manage-roles"),
  bulkDeactivateUsers
);

router.delete(
  "/users/bulk-delete",
  checkPermission("user:delete"),
  bulkDeleteUsers
);

router.get(
  "/roles",
  checkPermission("system:manage-roles"),
  getAllRoles
);

router.put(
  "/roles/:id",
  checkPermission("system:manage-roles"),
  updateRole
);

router.get(
  "/settings",
  checkPermission("system:manage-settings"),
  getSystemSettings
);

router.delete(
  "/cleanup/inactive-users",
  checkPermission("system:manage-settings"),
  cleanupInactiveUsers
);

router.delete(
  "/cleanup/audit-logs",
  checkPermission("system:manage-settings"),
  cleanupOldAuditLogs
);

module.exports = router;