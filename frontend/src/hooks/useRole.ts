import { useAuth } from "./useAuth";

export const useRole = (roles: string[]) => {
  const { user } = useAuth();
  return roles.includes(user?.role?.name || "");
};
