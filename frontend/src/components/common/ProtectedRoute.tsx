import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

interface Props {
  roles: string[];
  children: JSX.Element;
}

export default function ProtectedRoute({ roles, children }: Props) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return children;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user?.role?.name;

  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(userRole)) {
    return <Navigate to="/not-found" replace />;
  }

  return children;
}
