import { useAuth } from "./useAuth";

export const useRole = () => {
  const { role } = useAuth();

  return {
    role,
    isAdmin: role === "ADMIN",
    isManager: role === "MANAGER",
    isUser: role === "USER",
  };
};
