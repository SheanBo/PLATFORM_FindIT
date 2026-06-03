import { NavLink, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, Settings } from 'lucide-react';
import { useState } from 'react';

export function ModernNavigation({ navItems = [], user, onLogout, onSettings }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isActive = (to) => location.pathname === to;

  const SidebarContent = () => (
    <>
      {/* Logo Section */}
      <div className="px-lg py-xl border-b border-amber-700">
        <div className="flex items-center gap-md">
          <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
            <span className="text-slate-900 font-bold text-sm">F</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-h4 font-bold text-white leading-none">FindIT</h1>
            <p className="text-caption text-amber-200">Lost & Found</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-md space-y-xs overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive: active }) =>
              `flex items-center gap-md px-md py-2.5 rounded-lg text-sm font-medium transition-all duration-fast ${
                active
                  ? 'bg-amber-500 text-slate-900 shadow-sm'
                  : 'text-amber-100 hover:bg-slate-800 active:bg-slate-700'
              }`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Profile Section */}
      <div className="p-md space-y-md border-t border-amber-700">
        <div className="flex items-center gap-md px-md py-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0 font-semibold text-sm text-slate-900">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-amber-200">{user?.role}</p>
          </div>
        </div>

        <div className="flex gap-xs">
          {onSettings && (
            <button
              onClick={() => {
                onSettings?.();
                setSidebarOpen(false);
              }}
              className="flex-1 text-amber-100 hover:bg-slate-800 active:bg-slate-700 py-1.5 text-xs flex items-center justify-center gap-sm rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          )}
          <button
            onClick={() => {
              onLogout?.();
              setSidebarOpen(false);
            }}
            className="flex-1 text-amber-100 hover:bg-slate-800 active:bg-slate-700 py-1.5 text-xs flex items-center justify-center gap-sm rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-amber-700 flex-shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 bg-slate-900 border-b border-amber-700 px-lg py-md flex items-center gap-md z-40">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-amber-500 hover:text-amber-400 p-1.5 rounded transition-colors"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <h1 className="text-h4 font-bold text-white">FindIT</h1>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <aside className="md:hidden fixed left-0 top-0 z-50 w-64 h-screen bg-slate-900 overflow-y-auto">
          <SidebarContent />
        </aside>
      )}
    </>
  );
}
