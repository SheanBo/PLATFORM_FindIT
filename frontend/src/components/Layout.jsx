import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Package,
  Zap,
  ClipboardCheck,
  Archive,
  LogOut,
  Search,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  {
    to: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
    roles: ['Staff', 'Admin'],
  },
  {
    to: '/my-stats',
    icon: LayoutDashboard,
    label: 'My Overview',
    roles: ['Student'],
  },
  {
    to: '/lost-reports',
    icon: FileText,
    label: 'Lost Reports',
    roles: ['Student', 'Staff', 'Admin'],
  },
  {
    to: '/found-items',
    icon: Package,
    label: 'Found Items',
    roles: ['Student', 'Staff', 'Admin'],
  },
  {
    to: '/matching',
    icon: Zap,
    label: 'Matches',
    roles: ['Student', 'Staff', 'Admin'],
  },
  {
    to: '/claims',
    icon: ClipboardCheck,
    label: 'Claims',
    roles: ['Student', 'Staff', 'Admin'],
  },
  { to: '/storage', icon: Archive, label: 'Storage', roles: ['Staff', 'Admin'] },
];

export function Layout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  if (!user) return <Navigate to="/login" />;

  const allowed = navItems.filter((n) => n.roles.includes(user.role));

  const SidebarContent = () => (
    <>
      {/* Sidebar Header */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary bg-opacity-20 rounded-xl flex items-center justify-center">
            <Search className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none">FindIT</h1>
            <p className="text-slate-400 text-xs">OSA Lost & Found</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {allowed.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all group ${
                isActive
                  ? 'bg-secondary text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">{label}</span>
            {/* Active indicator */}
            <ChevronRight className="w-4 h-4 opacity-0 group-active:opacity-100 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-4 py-3 mb-3 bg-slate-800 rounded-lg">
          <div className="w-9 h-9 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-primary text-xs font-bold">
              {user.first_name?.[0]}
              {user.last_name?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-slate-400 text-xs">{user.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 text-slate-300 hover:text-white hover:bg-slate-800 text-sm px-4 py-2.5 w-full rounded-lg transition-colors font-semibold"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-primary flex-shrink-0 border-r border-slate-800">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative flex flex-col w-64 bg-primary">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-600 hover:text-slate-900 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <h1 className="font-bold text-slate-900">FindIT</h1>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
