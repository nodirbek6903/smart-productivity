import { Routes, Route } from "react-router-dom";
import LoginPage from "../features/auth/LoginPage";
import RegisterPage from "../features/auth/RegisterPage";
import ForgotPassword from "../features/auth/ForgotPasswordPage";

import ProtectedRoute from "../components/common/ProtectedRoute";

// Layouts
import AdminLayout from "../components/layout/AdminLayout";
import ManagerLayout from "../components/layout/ManagerLayout";
import UserLayout from "../components/layout/UserLayout";

// Dashboards
import AdminDashboard from "../features/dashboard/AdminDashboard";
import ManagerDashboard from "../features/dashboard/ManagerDashboard";
import UserDashboard from "../features/dashboard/UserDashboard";

export default function AppRouter() {
  return (
    <Routes>

      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot" element={<ForgotPassword />} />

      {/* Admin */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
      </Route>

      {/* Manager */}
      <Route
        path="/manager/*"
        element={
          <ProtectedRoute roles={["MANAGER"]}>
            <ManagerLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<ManagerDashboard />} />
      </Route>

      {/* User */}
      <Route
        path="/user/*"
        element={
          <ProtectedRoute roles={["USER"]}>
            <UserLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<UserDashboard />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<div>Not Found</div>} />
    </Routes>
  );
}
