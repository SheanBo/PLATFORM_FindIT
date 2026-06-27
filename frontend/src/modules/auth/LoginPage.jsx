import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { Eye, EyeOff, AlertCircle, User, Lock, ShieldCheck } from 'lucide-react';

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
    <div
      className="min-h-screen flex items-center relative"
      style={{
        backgroundImage: 'url(/ateneo.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Branded directional overlay — deep navy behind the form, clearing to
          reveal the campus on the right. Adds depth and keeps text legible. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(105deg, rgba(22,33,61,0.92) 0%, rgba(22,33,61,0.72) 38%, rgba(22,33,61,0.30) 66%, rgba(22,33,61,0.05) 100%)'
        }}
      />

      {/* Login Form */}
      <div className="relative z-10 w-full flex justify-center md:justify-start px-6 sm:px-10 lg:pl-20 py-12">
        <div
          className="w-full max-w-md rounded-2xl p-8 sm:p-10"
          style={{
            backgroundColor: 'rgba(22,33,61,0.45)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(242,205,107,0.25)',
            boxShadow: '0 24px 60px -24px rgba(0,0,0,0.65)'
          }}
        >
          {/* Logo and Branding */}
          <div className="mb-6 flex items-center gap-3">
            <img
              src="/FindIT_Logo.png"
              alt="FindIT Logo"
              className="w-10 h-10 object-contain flex-shrink-0"
            />
            <h1 className="text-2xl font-bold" style={{ color: 'var(--cream-100)' }}>FindIT</h1>
          </div>

          {/* Welcome heading */}
          <div className="mb-7">
            <h2 className="text-xl font-bold" style={{ color: 'var(--cream-100)' }}>Welcome back</h2>
            <p className="text-sm mt-1" style={{ color: 'rgba(251,243,220,0.7)' }}>
              Sign in to the OSA Lost &amp; Found system
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div role="alert" className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'rgba(199, 69, 69, 0.1)', borderLeft: '4px solid var(--status-terracotta)' }}>
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--status-terracotta)' }} />
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--status-terracotta)' }}>Login Failed</p>
                  <p className="text-sm" style={{ color: 'var(--status-terracotta)' }}>{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block mb-2 text-sm font-medium" style={{ color: 'var(--cream-100)' }}>Username or Email</label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--gold-500)' }} aria-hidden="true" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="xxxxxxxx@gbox.adnu.edu.ph"
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  disabled={loading}
                  autoFocus
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-lg border-2 transition-all focus:outline-none"
                  style={{
                    backgroundColor: 'rgba(251,243,220,0.08)',
                    borderColor: 'rgba(212,162,78,0.5)',
                    color: 'var(--cream-100)'
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block mb-2 text-sm font-medium" style={{ color: '#FBF3DC' }}>Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--gold-500)' }} aria-hidden="true" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••••"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  disabled={loading}
                  required
                  className="w-full pl-11 pr-12 py-3 rounded-lg border-2 transition-all focus:outline-none"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    borderColor: 'rgba(212,162,78,0.5)',
                    color: 'white'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:opacity-80"
                  style={{ color: 'var(--gold-500)' }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 font-semibold rounded-lg transition-all mt-8 hover:brightness-95 shadow-lg disabled:opacity-70"
              style={{
                backgroundColor: 'var(--gold-500)',
                color: 'var(--navy-900)'
              }}
            >
              {loading ? (
                <>
                  <span className="inline-block mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="text-center mt-6 pt-6" style={{ borderTop: '1px solid rgba(212,162,78,0.3)' }}>
            <p className="text-sm" style={{ color: 'var(--cream-100)' }}>
              New student?{' '}
              <Link
                to="/register"
                className="font-semibold hover:opacity-80 transition-all"
                style={{ color: 'var(--gold-500)' }}
              >
                Create an account
              </Link>
            </p>
            <p className="text-xs mt-4 flex items-center justify-center gap-1.5" style={{ color: 'rgba(251,243,220,0.6)' }}>
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              Secure sign-in for Ateneo de Naga accounts
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
