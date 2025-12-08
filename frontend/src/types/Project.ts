import { User } from "./User";

export interface ProjectMember {
  user: User;
  role: string;
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  status: "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
  manager: User;
  members: ProjectMember[];
  createdAt?: string;
  updatedAt?: string;
}
