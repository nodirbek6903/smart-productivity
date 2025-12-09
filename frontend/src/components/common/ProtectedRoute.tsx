import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

interface Props {
  roles: string[];
  children: JSX.Element;
}

export default function ProtectedRoute({ roles, children }: Props) {
  const { user, isAuthenticated } = useAuth();

  // 1) Agar login qilinmagan bo‘lsa → /login ga yuboramiz
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // 2) User modeliga mos ravishda role tekshiramiz
  const userRole = user?.role?.name; // ADMIN | MANAGER | USER

  if (!userRole) return <Navigate to="/not-found" replace />;

  // 3) Role ruxsat berilgan bo‘lsa - ruxsat
  if (!roles.includes(userRole)) return <Navigate to="/not-found" replace />;

  return children;
}
