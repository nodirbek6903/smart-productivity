const mongoose = require("mongoose");
const Role = require("../models/Role");
const User = require("../models/User");
const dotenv = require("dotenv");

dotenv.config();

const ADMIN_PERMISSIONS = [
  //user management
  "user:create",
  "user:read",
  "user:update",
  "user:delete",
  "user:manage-roles",

  // project management
  "project:create",
  "project:read",
  "project:update",
  "project:delete",
  "project:manage-all",

  // task management
  "task:create",
  "task:read",
  "task:update",
  "task:delete",
  "task:assign",
  "task:manage-all",

  // department management
  "department:create",
  "department:read",
  "department:update",
  "department:delete",

  // team management
  "team:create",
  "team:read",
  "team:update",
  "team:delete",
  "team:manage-all",

  // document management
  "document:upload",
  "document:read",
  "document:update",
  "document:delete",
  "document:manage-all",

  // report & analytics
  "report:view-all",
  "report:export",
  "analytics:view-all",

  // audit & logs
  "audit:view",
  "audit:export",

  // system settings
  "system:manage-settings",
  "system:manage-roles",
  "system:backup",
  "system:view-stats",
];

const MANAGER_PERMISSIONS = [
  //user management (limited)
  "user:read",
  "user:view-team",

  // project management
  "project:create",
  "project:read",
  "project:update",
  "project:manage-own",

  // task management
  "task:create",
  "task:read",
  "task:update",
  "task:delete",
  "task:assign",
  "task:manage-team",

  //department
  "department:read",

  // team management
  "team:read",
  "team:manage-members",

  // document management
  "document:upload",
  "document:read",
  "document:update",
  "document:delete",

  // report & analytics
  "report:view-team",
  "report:export",
  "report:view-team",

  // timesheet
  "timesheet:approve",
];

const USER_PERMISSIONS = [
  //own profile
  "user:read-own",
  "user:update-own",

  // projects (read only)
  "project:read",

  // tasks
  "task:read",
  "task:update-own",
  "task:create-subtask",

  //documents
  "document:upload",
  "document:read",
  "document:delete-own",

  // time tracking
  "time:log-own",
  "time:view-own",

  // comments
  "comment:create",
  "comment:read",
  "comment:delete-own",

  // notifications
  "notification:read-own",
];

const roles = [
  {
    name: "ADMIN",
    description: "Tizim administratori - to'liq huquqlar",
    permissions: ADMIN_PERMISSIONS,
    isActive: true,
  },
  {
    name: "MANAGER",
    description: "Loyiha va jamoa menejeri",
    permissions: MANAGER_PERMISSIONS,
    isActive: true,
  },
  {
    name: "USER",
    description: "Oddiy foydalanuvchi",
    permissions: USER_PERMISSIONS,
    isActive: true,
  },
];

const seedRoles = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB ga ulanildi");

    // eski rollarni ochirish
    await Role.deleteMany({});
    console.log("Eski rollar ochirildi");

    // yangi rollarni yaratish
    const createdRoles = await Role.insertMany(roles);
    console.log("Rollar muvaffaqqiyatli yaratildi:");
    createdRoles.forEach((role) => {
      console.log(` - ${role.name}: ${role.permissions.length} ta permission`);
    });

    const adminRole = createdRoles.find((r) => r.name === "ADMIN");

    const existingAdmin = await User.findOne({ email: "nu2913634@gmail.com" });
    if (!existingAdmin) {
      const adminUser = await User.create({
        fullName: "Super Admin",
        email: "nu2913634@gmail.com",
        password: "Admin6903",
        role: adminRole._id,
        isActive: true,
        isEmailVerified: true,
        phone: "+998903646903",
      });

      console.log("\n Admin foydalanuvchi yaratildi:");
      console.log(`Email: ${adminUser.email}`);
      console.log("Muhim: Parolni darhol o'zgartiring!");
    } else {
      console.log("\n Admin foydalanuvchi allaqachon mavjud");
    }

    console.log("\n Seed muvaffaqqiyatli bajarildi!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed xatosi:", error.message);
    process.exit(1);
  }
};


if(require.main === module){
    seedRoles()
}

module.exports = seedRoles
