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
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Clean Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-xs">
          {/* Logo */}
          <div className="mb-12">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: 'var(--gold-500)' }}>
                <span className="text-lg font-bold" style={{ color: 'var(--navy-900)' }}>F</span>
              </div>
              <h1 className="text-xl font-semibold" style={{ color: 'var(--navy-900)' }}>FindIT</h1>
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-semibold mb-8" style={{ color: 'var(--navy-900)' }}>
            Sign in with your Riot Account
          </h2>

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
          <form onSubmit={handleSubmit} className="space-y-3 mb-6">
            {/* Username Field */}
            <div>
              <input
                type="text"
                className="input"
                placeholder="Email"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                disabled={loading}
                autoFocus
                required
                style={{
                  backgroundColor: '#F8F8F8',
                  borderColor: '#E0E0E0',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  disabled={loading}
                  required
                  style={{
                    backgroundColor: '#F8F8F8',
                    borderColor: '#E0E0E0',
                    fontSize: '14px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#999' }}
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

            {/* Keep signed in checkbox */}
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--brown-900)' }}>
              <input
                type="checkbox"
                className="w-4 h-4 rounded"
                defaultChecked
              />
              Keep me signed in
            </label>

            {/* Sign In Button - Red Circular */}
            <div className="pt-4 flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="w-14 h-14 rounded-full flex items-center justify-center transition-all hover:shadow-lg"
                style={{ backgroundColor: 'var(--status-terracotta)' }}
                aria-label="Sign in"
              >
                {loading ? (
                  <span className="loading-spinner" />
                ) : (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
          </form>

          {/* Links */}
          <div className="space-y-2 text-center text-sm">
            <p style={{ color: '#999' }}>
              <Link
                to="/register"
                className="hover:opacity-80 transition-all"
                style={{ color: 'var(--navy-900)' }}
              >
                New student? Create an account
              </Link>
            </p>
            <p style={{ color: '#999' }}>
              <a
                href="#"
                className="hover:opacity-80 transition-all"
                style={{ color: 'var(--navy-900)' }}
              >
                Can't sign in?
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Ateneo Image */}
      <div
        className="hidden lg:block lg:w-1/2 relative overflow-hidden"
        style={{
          backgroundImage: 'linear-gradient(135deg, rgba(0,120,150,0.6), rgba(0,150,180,0.6)), url(https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&h=1200&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Bottom branding */}
        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/60 to-transparent">
          <p className="text-white text-lg font-semibold">Ateneo de Naga University</p>
          <p className="text-white/80 text-sm">Office of Student Affairs</p>
        </div>
      </div>
    </div>
  );
}
