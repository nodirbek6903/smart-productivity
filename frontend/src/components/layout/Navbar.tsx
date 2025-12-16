import { useState } from "react";
import { MdNotifications } from "react-icons/md";
import { useAuth } from "../../hooks/useAuth";
import { useDispatch } from "react-redux";
import { logout } from "../../features/auth/authSlice";
import { useNavigate } from "react-router-dom";

const notificationsByRole: Record<string, string[]> = {
  ADMIN: [
    "Yangi foydalanuvchi ro'yxatdan o'tdi",
    "Yangi loyiha yaratildi",
    "Audit log yangilandi",
  ],
  MANAGER: ["Project deadline yaqinlashmoqda", "Yangi task sizga biriktirildi"],
  USER: ["Sizga yangi task berildi", "Task holati o'zgardi"],
};

const Navbar = () => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

  const role = user?.role.name || "USER";
  const notifications = notificationsByRole[role] || [];

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <header className="h-16 bg-gray-800 flex items-center justify-between px-6 border-b border-gray-700">
      <h1 className="text-white font-semibold">{role} Panel</h1>

      <div className="flex items-center gap-6 relative">
        {/* 🔔 Notification Bell */}
        <button
          onClick={() => setOpen(!open)}
          className="relative cursor-pointer text-gray-300 hover:text-white transition"
        >
          <MdNotifications size={24} />

          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-1.5 rounded-full">
              {notifications.length}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 top-12 w-72 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50">
            <div className="p-3 text-white font-semibold border-b border-gray-700">
              Notifications
            </div>

            <ul className="max-h-64 overflow-y-auto">
              {notifications.map((note, idx) => (
                <li
                  key={idx}
                  className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
                >
                  {note}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* User + Logout */}
        <div className="flex items-center gap-3">
          <span className="text-gray-300 text-sm">{user?.fullName}</span>

          <button
            onClick={handleLogout}
            className="bg-red-600 cursor-pointer hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
