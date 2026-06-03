import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { Search, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.username, form.password);
      navigate(user.role === 'Student' ? '/my-stats' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mx-auto mb-4">
            <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold text-slate-900">F</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-1">FindIT</h1>
          <p className="text-amber-200 text-sm">Ateneo de Naga University • Office of Student Affairs</p>
        </div>

        {/* Login Card */}
        <div className="card shadow-2xl">
          <h2 className="text-xl font-semibold text-slate-900 mb-6 text-center">Sign in to your account</h2>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-error mb-6">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <div className="alert-title">Login Failed</div>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div>
              <label className="label">Username or Email</label>
              <input
                type="text"
                className="input"
                placeholder="ahfresnido@gbox.adnu.edu.ph"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                disabled={loading}
                autoFocus
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••••"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-600 hover:text-amber-700 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
            >
              {loading ? (
                <>
                  <span className="loading-spinner" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="text-center mt-6 pt-6 border-t border-amber-200">
            <p className="text-sm text-amber-900">
              New student?{' '}
              <Link
                to="/register"
                className="text-amber-600 font-semibold hover:text-amber-700 transition-all"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Demo Credentials Card */}
        <div className="card mt-6 bg-amber-50 border-amber-300">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 pt-0.5">
              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-amber-200">
                <span className="text-amber-900 text-xs font-bold">?</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-950 mb-3">
                Demo Credentials
              </p>
              <div className="space-y-2 text-xs text-amber-800">
                <div>
                  <p className="font-medium">Admin</p>
                  <code className="text-amber-700">admin / Password123!</code>
                </div>
                <div>
                  <p className="font-medium">Staff</p>
                  <code className="text-amber-700">staff1 / Password123!</code>
                </div>
                <div>
                  <p className="font-medium">Student</p>
                  <code className="text-amber-700">juan.delacruz / Password123!</code>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-amber-200 mt-8">
          © 2026 FindIT. All rights reserved.
        </p>
      </div>
    </div>
  );
}
