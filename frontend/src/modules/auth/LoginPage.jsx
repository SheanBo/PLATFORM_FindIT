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
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--cream-100)' }}>
      {/* Left Side - Login Form */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center px-8 py-12">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--gold-500)' }}>
                <span className="text-xl font-bold" style={{ color: 'var(--navy-900)' }}>F</span>
              </div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--navy-900)' }}>FindIT</h1>
            </div>
            <h2 className="text-sm font-semibold text-gray-600 mt-4">Ateneo de Naga University</h2>
          </div>

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
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div>
              <input
                type="text"
                className="input"
                placeholder="your.gbox account"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                disabled={loading}
                autoFocus
                required
                style={{ backgroundColor: '#F5F5F5' }}
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••••"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  disabled={loading}
                  required
                  style={{ backgroundColor: '#F5F5F5' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--rust-600)' }}
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
              className="w-full py-3 text-base font-semibold rounded-lg transition-all text-white mt-6"
              style={{ backgroundColor: 'var(--navy-900)' }}
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

          {/* Links */}
          <div className="mt-8 space-y-3">
            <div className="text-center">
              <p className="text-xs" style={{ color: 'var(--rust-600)' }}>
                New student?{' '}
                <Link
                  to="/register"
                  className="font-semibold hover:opacity-80 transition-all"
                  style={{ color: 'var(--navy-900)' }}
                >
                  Create an account
                </Link>
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs" style={{ color: 'var(--rust-600)' }}>
                Can't sign in?{' '}
                <a
                  href="#"
                  className="font-semibold hover:opacity-80 transition-all"
                  style={{ color: 'var(--navy-900)' }}
                >
                  Reset password
                </a>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t" style={{ borderColor: 'var(--gold-300)' }}>
            <p className="text-xs text-center" style={{ color: 'var(--rust-600)' }}>
              © 2026 FindIT. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Ateneo Image */}
      <div className="hidden md:block md:w-1/2 relative overflow-hidden">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1553531088-551f956cbf8d?w=800&h=900&fit=crop)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Gradient Overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, rgba(22, 33, 61, 0.4) 0%, rgba(74, 37, 17, 0.2) 100%)',
            }}
          ></div>

          {/* Ateneo Branding */}
          <div className="absolute bottom-8 left-8 right-8">
            <h2 className="text-white text-3xl font-bold mb-2">Ateneo de Naga</h2>
            <p className="text-white text-sm opacity-90">Office of Student Affairs</p>
          </div>
        </div>
      </div>
    </div>
  );
}
