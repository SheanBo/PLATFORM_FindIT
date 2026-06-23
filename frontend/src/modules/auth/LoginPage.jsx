import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';

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
      className="min-h-screen flex items-center"
      style={{
        backgroundImage: 'url(/ateneo.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay for readability */}
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}></div>

      {/* Left Side - Navy Card Login Form */}
      <div className="relative w-full md:w-1/3 flex flex-col items-center justify-center pl-32 pr-2 py-12 z-10" style={{ transform: 'translateY(-10px) translateX(150px)' }}>
        <div className="w-full max-w-2xl rounded-3xl p-12 shadow-2xl" style={{ backgroundColor: 'transparent' }}>
          {/* Logo and Branding */}
          <div className="mb-8 flex items-center gap-3">
            <img
              src="/FindIT_Logo.png"
              alt="FindIT Logo"
              className="w-10 h-10 object-contain flex-shrink-0"
            />
            <h1 className="text-2xl font-bold" style={{ color: 'var(--cream-100)' }}>FindIT</h1>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'rgba(199, 69, 69, 0.1)', borderLeft: '4px solid var(--status-terracotta)' }}>
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
              <label className="block mb-2 text-sm font-medium" style={{ color: 'var(--cream-100)' }}>Username or Email</label>
              <input
                type="text"
                placeholder="xxxxxxxx@gbox.adnu.edu.ph"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                disabled={loading}
                autoFocus
                required
                className="w-full px-4 py-3 rounded-lg border-2 transition-all focus:outline-none"
                style={{
                  backgroundColor: 'rgba(251,243,220,0.08)',
                  borderColor: 'rgba(212,162,78,0.5)',
                  color: 'var(--cream-100)'
                }}
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block mb-2 text-sm font-medium" style={{ color: '#FBF3DC' }}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  disabled={loading}
                  required
                  className="w-full px-4 py-3 pr-12 rounded-lg border-2 transition-all focus:outline-none"
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
              className="w-full py-3 font-semibold rounded-lg transition-all mt-8"
              style={{
                backgroundColor: 'var(--cream-100)',
                color: 'var(--gold-500)'
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
          </div>
        </div>
      </div>

      {/* Left side branding overlay - Ateneo de Naga text */}
      <div
        className="absolute left-0 top-0 bottom-0 p-8 hidden md:flex flex-col items-start justify-end"
        style={{
          background: 'linear-gradient(to right, rgba(0,0,0,0.5), rgba(0,0,0,0.2), transparent)'
        }}
      >
        <h3 className="text-white text-3xl font-bold">Ateneo de Naga</h3>
        <p className="text-white/90 text-sm">Office of Student Affairs</p>
      </div>
    </div>
  );
}
