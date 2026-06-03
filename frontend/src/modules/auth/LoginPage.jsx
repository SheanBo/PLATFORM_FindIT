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
    <div className="min-h-screen gradient-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-secondary bg-opacity-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-secondary" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">FindIT</h1>
          <p className="text-slate-200 text-sm">Ateneo de Naga University • Lost & Found System</p>
        </div>

        {/* Login Card */}
        <div className="card shadow-2xl">
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
                placeholder="Enter your username"
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
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
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
          <div className="text-center mt-6 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-secondary font-semibold hover:text-opacity-80 transition-all"
              >
                Create one here
              </Link>
            </p>
          </div>
        </div>

        {/* Demo Credentials Card */}
        <div className="card mt-6 bg-slate-50 border-slate-300">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 pt-0.5">
              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-secondary bg-opacity-20">
                <span className="text-secondary text-xs font-bold">?</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900 mb-3">
                Demo Credentials
              </p>
              <div className="space-y-2 text-xs text-slate-700">
                <div>
                  <p className="font-medium">Admin Account</p>
                  <code className="text-slate-600">admin / Password123!</code>
                </div>
                <div>
                  <p className="font-medium">Staff Account</p>
                  <code className="text-slate-600">staff1 / Password123!</code>
                </div>
                <div>
                  <p className="font-medium">Student Account</p>
                  <code className="text-slate-600">juan.delacruz / Password123!</code>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-300 mt-8">
          © 2026 FindIT. All rights reserved.
        </p>
      </div>
    </div>
  );
}
