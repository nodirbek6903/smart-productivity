import { User } from "./User";
import { Project } from "./Project";

export interface Task {
  _id: string;
  title: string;
  description?: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "TODO" | "IN_PROGRESS" | "DONE" | "REVIEW" | "TESTING" | "CANCELLED";
  createdBy: User;
  assignedTo: User;
  project: Project;
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
}
