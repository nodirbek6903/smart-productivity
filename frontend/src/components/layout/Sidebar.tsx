import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  MdDashboard,
  MdPeople,
  MdApartment,
  MdGroups,
  MdWork,
  MdTask,
  MdHistory,
  MdDescription,
  MdNotifications,
  MdAccessTime,
  MdAssessment,
} from "react-icons/md";

const adminMenu = [
  { label: "Dashboard", path: "/admin/dashboard", icon: <MdDashboard /> },
  { label: "Users", path: "/admin/users", icon: <MdPeople /> },
  { label: "Departments", path: "/admin/departments", icon: <MdApartment /> },
  { label: "Teams", path: "/admin/teams", icon: <MdGroups /> },
  { label: "Projects", path: "/admin/projects", icon: <MdWork /> },
  { label: "Tasks", path: "/admin/tasks", icon: <MdTask /> },
  { label: "Audit Logs", path: "/admin/audit-logs", icon: <MdHistory /> },
  { label: "Documents", path: "/admin/documents", icon: <MdDescription /> },
  {
    label: "Notifications",
    path: "/admin/notifications",
    icon: <MdNotifications />,
  },
];

const managerMenu = [
  { label: "Dashboard", path: "/manager/dashboard", icon: <MdDashboard /> },
  { label: "Projects", path: "/manager/projects", icon: <MdWork /> },
  { label: "Tasks", path: "/manager/tasks", icon: <MdTask /> },
  { label: "Teams", path: "/manager/teams", icon: <MdGroups /> },
  { label: "Reports", path: "/manager/reports", icon: <MdAssessment /> },
  { label: "Documents", path: "/manager/documents", icon: <MdDescription /> },
  {
    label: "Notifications",
    path: "/manager/notifications",
    icon: <MdNotifications />,
  },
];

const userMenu = [
  { label: "Dashboard", path: "/user/dashboard", icon: <MdDashboard /> },
  { label: "My Tasks", path: "/user/tasks", icon: <MdTask /> },
  {
    label: "Time Tracker",
    path: "/user/time-tracker",
    icon: <MdAccessTime />,
  },
  { label: "Documents", path: "/user/documents", icon: <MdDescription /> },
  {
    label: "Notifications",
    path: "/user/notifications",
    icon: <MdNotifications />,
  },
];

const Sidebar = () => {
  const { user } = useAuth();
  const role = user?.role.name;

  const menu =
    role === "ADMIN" ? adminMenu : role === "MANAGER" ? managerMenu : userMenu;

  return (
    <aside className="w-64 bg-gray-900 text-gray-200 min-h-screen p-4">
      <h2 className="text-xl font-bold mb-6 text-white">CRM System</h2>

      <nav className="space-y-1">
        {menu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-lg transition
              ${isActive ? "bg-blue-600 text-white" : "hover:bg-gray-800"}`
            }
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
