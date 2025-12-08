import { useAppSelector } from "../app/hooks";

export const useAuth = () => {
  const { token, user } = useAppSelector((state) => state.auth);

  const isAuthenticated = Boolean(token);
  const role = user?.role?.name;

  return {
    token,
    user,
    role,
    isAuthenticated,
    isAdmin: role === "ADMIN",
    isManager: role === "MANAGER",
    isUser: role === "USER"
  };
};
