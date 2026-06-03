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
      {/* Left Side - Navy Card Login Form */}
      <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col items-center justify-center px-4 py-12 md:px-6">
        <div className="w-full max-w-sm rounded-3xl p-8 shadow-2xl" style={{ backgroundColor: 'var(--navy-900)' }}>
          {/* Header */}
          <div className="mb-8 flex items-center gap-3">
            <img
              src="/FindIT Logo.jpg"
              alt="FindIT Logo"
              className="w-10 h-10 object-contain flex-shrink-0"
            />
            <h1 className="text-2xl font-bold text-white">FindIT</h1>
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
                style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  borderColor: 'rgba(212,162,78,0.3)',
                  color: 'white'
                }}
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
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    borderColor: 'rgba(212,162,78,0.3)',
                    color: 'white'
                  }}
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
              className="w-full py-3 text-base font-semibold rounded-lg transition-all text-white mt-6"
              style={{ backgroundColor: 'var(--gold-500)', color: 'var(--navy-900)' }}
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

      {/* Right Side - Ateneo Image */}
      <div
        className="hidden md:block md:w-2/3 lg:w-3/4 relative overflow-hidden"
        style={{
          backgroundImage: 'linear-gradient(135deg, rgba(0,0,0,0.1), rgba(0,0,0,0.05)), url(/ateneo.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 35%'
        }}
      >
        {/* Bottom branding overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/50 to-transparent">
          <h3 className="text-white text-2xl font-bold">Ateneo de Naga</h3>
          <p className="text-white/80 text-sm">Office of Student Affairs</p>
        </div>
      </div>
    </div>
  );
}
