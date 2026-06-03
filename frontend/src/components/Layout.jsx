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
      <div className="p-6 border-b" style={{ borderColor: 'rgba(212, 162, 78, 0.2)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--gold-500)' }}>
            <Search className="w-5 h-5" style={{ color: 'var(--navy-900)' }} />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none">FindIT</h1>
            <p className="text-sm opacity-75" style={{ color: 'white' }}>OSA Lost & Found</p>
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
                isActive ? 'text-white shadow-md' : 'text-white text-opacity-70 hover:text-opacity-100'
              }`
            }
            style={({ isActive }) => ({
              backgroundColor: isActive ? 'var(--gold-500)' : 'transparent',
              color: isActive ? 'var(--navy-900)' : 'white'
            })}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">{label}</span>
            {/* Active indicator */}
            <ChevronRight className="w-4 h-4 opacity-0 group-active:opacity-100 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t" style={{ borderColor: 'rgba(212, 162, 78, 0.2)' }}>
        <div className="flex items-center gap-3 px-4 py-3 mb-3 rounded-lg" style={{ backgroundColor: 'rgba(212, 162, 78, 0.1)' }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white" style={{ backgroundColor: 'var(--gold-500)' }}>
            {user.first_name?.[0]}
            {user.last_name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-sm opacity-75" style={{ color: 'white' }}>{user.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 text-white text-sm px-4 py-2.5 w-full rounded-lg transition-colors font-semibold hover:opacity-80"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--cream-100)' }}>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 flex-shrink-0 border-r" style={{ backgroundColor: 'var(--navy-900)', borderColor: 'rgba(212, 162, 78, 0.2)' }}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative flex flex-col w-64" style={{ backgroundColor: 'var(--navy-900)' }}>
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-white p-2 rounded-lg transition-colors hover:opacity-80"
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
        <header className="md:hidden bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-40" style={{ borderColor: 'var(--gold-300)' }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="transition-colors"
            style={{ color: 'var(--navy-900)' }}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 flex items-center gap-2">
            <Search className="w-4 h-4" style={{ color: 'var(--rust-600)' }} />
            <h1 className="font-bold" style={{ color: 'var(--navy-900)' }}>FindIT</h1>
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
