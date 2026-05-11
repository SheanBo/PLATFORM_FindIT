import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import {
  LayoutDashboard, FileText, Package, GitMerge,
  ClipboardCheck, Archive, LogOut, Search, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['Staff','Admin'] },
  { to: '/my-stats', icon: LayoutDashboard, label: 'My Overview', roles: ['Student'] },
  { to: '/lost-reports', icon: FileText, label: 'Lost Reports', roles: ['Student','Staff','Admin'] },
  { to: '/found-items', icon: Package, label: 'Found Items', roles: ['Student','Staff','Admin'] },
  { to: '/matching', icon: GitMerge, label: 'Matches', roles: ['Student','Staff','Admin'] },
  { to: '/claims', icon: ClipboardCheck, label: 'Claims', roles: ['Student','Staff','Admin'] },
  { to: '/storage', icon: Archive, label: 'Storage', roles: ['Staff','Admin'] },
];

export function Layout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  if (!user) return <Navigate to="/login" />;

  const allowed = navItems.filter(n => n.roles.includes(user.role));

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-blue-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <Search className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none">FindIT</h1>
            <p className="text-blue-300 text-xs">OSA Lost & Found</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {allowed.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-blue-800 text-white' : 'text-blue-200 hover:bg-blue-800/60 hover:text-white'
              }`
            }>
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-blue-800">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 bg-blue-800 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {user.first_name?.[0]}{user.last_name?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user.first_name} {user.last_name}</p>
            <p className="text-blue-300 text-xs">{user.role}</p>
          </div>
        </div>
        <button onClick={logout} className="flex items-center gap-2 text-blue-300 hover:text-white text-sm px-3 py-2 w-full rounded-lg hover:bg-blue-800/60 transition-colors">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-blue-900 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-64 bg-blue-900">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-blue-300 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden bg-white border-b px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600"><Menu className="w-5 h-5" /></button>
          <h1 className="font-semibold text-gray-900">FindIT</h1>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
