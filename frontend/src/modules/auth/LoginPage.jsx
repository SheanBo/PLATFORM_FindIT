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
      {/* Left Side - Features */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--rust-600)' }}>
            Module 01 · Authentication
          </h2>
          <h1 className="text-5xl font-bold mb-12" style={{ color: 'var(--brown-900)' }}>
            Login & Registration
          </h1>

          <div className="space-y-8">
            {/* Feature 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-1 rounded-full" style={{ backgroundColor: 'var(--gold-500)' }}></div>
              <div>
                <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--brown-900)' }}>
                  Username or email sign-in
                </h3>
                <p className="text-sm" style={{ color: 'var(--rust-600)' }}>
                  Hashed passwords, JWT tokens, 7-day sessions.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-1 rounded-full" style={{ backgroundColor: 'var(--gold-500)' }}></div>
              <div>
                <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--brown-900)' }}>
                  Public student registration
                </h3>
                <p className="text-sm" style={{ color: 'var(--rust-600)' }}>
                  Email validation, 8-character password rule.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-1 rounded-full" style={{ backgroundColor: 'var(--gold-500)' }}></div>
              <div>
                <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--brown-900)' }}>
                  Role-based redirect
                </h3>
                <p className="text-sm" style={{ color: 'var(--rust-600)' }}>
                  Lands each user on their correct dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-0">
        <div className="w-full max-w-sm rounded-2xl p-8 shadow-xl" style={{ backgroundColor: 'var(--navy-900)' }}>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mx-auto mb-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--gold-500)' }}>
                <span className="text-2xl font-bold" style={{ color: 'var(--navy-900)' }}>F</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">FindIT</h1>
            <p className="text-sm" style={{ color: 'var(--gold-300)' }}>Sign in to your account</p>
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
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div>
              <label className="label text-white mb-2">Username or Email</label>
              <input
                type="text"
                className="input"
                placeholder="ahfresnido@gbox.adnu.edu.ph"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                disabled={loading}
                autoFocus
                required
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(212,162,78,0.3)', color: 'white' }}
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="label text-white mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••••"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  disabled={loading}
                  required
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(212,162,78,0.3)', color: 'white' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--gold-500)' }}
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
              className="w-full py-3 text-base font-semibold rounded-lg transition-all text-white"
              style={{ backgroundColor: 'var(--gold-500)' }}
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
          <div className="text-center mt-6 pt-6" style={{ borderTop: '1px solid rgba(212,162,78,0.2)' }}>
            <p className="text-sm" style={{ color: 'var(--gold-300)' }}>
              New student?{' '}
              <Link
                to="/register"
                className="font-semibold hover:opacity-80 transition-all"
                style={{ color: 'var(--gold-500)' }}
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
