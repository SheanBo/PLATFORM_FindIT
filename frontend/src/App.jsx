import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { Layout } from './components/Layout';

// Auth
import LoginPage from './modules/auth/LoginPage';
import RegisterPage from './modules/auth/RegisterPage';

// Dashboard
import DashboardPage from './modules/dashboard/DashboardPage';
import MyStatsPage from './modules/dashboard/MyStatsPage';

// Modules
import LostReportsPage from './modules/lost-reports/LostReportsPage';
import FoundItemsPage from './modules/found-items/FoundItemsPage';
import MatchingPage from './modules/matching/MatchingPage';
import ClaimsPage from './modules/claims/ClaimsPage';
import StoragePage from './modules/storage/StoragePage';

function RequireRole({ roles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (!roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return <Navigate to={user.role === 'Student' ? '/my-stats' : '/dashboard'} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected */}
          <Route element={<Layout />}>
            <Route index element={<HomeRedirect />} />
            <Route path="/dashboard" element={
              <RequireRole roles={['Staff','Admin']}><DashboardPage /></RequireRole>
            } />
            <Route path="/my-stats" element={<MyStatsPage />} />
            <Route path="/lost-reports" element={<LostReportsPage />} />
            <Route path="/found-items" element={<FoundItemsPage />} />
            <Route path="/matching" element={<MatchingPage />} />
            <Route path="/claims" element={<ClaimsPage />} />
            <Route path="/storage" element={
              <RequireRole roles={['Staff','Admin']}><StoragePage /></RequireRole>
            } />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
