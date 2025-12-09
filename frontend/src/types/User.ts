export interface IUser {
  _id: string;
  fullName: string;
  email: string;

  // Role modeli bilan bog‘langan
  role: {
    _id: string;
    name: "ADMIN" | "MANAGER" | "USER";
    permissions?: string[];
  };

  status: "active" | "inactive";

  avatar?: string;

  // Bog‘langan Department
  department?: {
    _id: string;
    name: string;
  };

  // Bog‘langan Team
  team?: {
    _id: string;
    name: string;
  };

  createdAt: string;
  updatedAt: string;
}
