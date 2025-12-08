import { User } from "./User";
import { Department } from "./User";

export interface Team {
  _id: string;
  name: string;
  department: Department;
  leader: User;
  members: User[];
  createdAt?: string;
  updatedAt?: string;
}
