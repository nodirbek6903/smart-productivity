export interface Role {
  _id: string;
  name: "ADMIN" | "MANAGER" | "USER";
  description: string;
}
export interface Department {
  _id: string;
  name: string;
}
export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: Role;
  department?: Department;
  position?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
}
