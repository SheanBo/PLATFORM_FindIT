import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    student_id: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/login', {
        state: {
          message:
            'Account created successfully! Please log in with your credentials.',
        },
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        backgroundImage: 'url(/ateneo.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay for readability */}
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}></div>

      <div className="relative w-full md:w-1/2 flex items-center justify-center z-10 mr-auto" style={{ paddingTop: '48px', paddingBottom: '48px' }}>
        <div className="w-full max-w-2xl">
          {/* Registration Card */}
          <div className="rounded-3xl p-12 shadow-2xl" style={{ backgroundColor: 'transparent' }}>
            {/* Back Button */}
            <button
              onClick={() => navigate(-1)}
              className="mb-6 flex items-center gap-2 hover:opacity-80 transition-all"
              style={{ color: '#FFFFFF' }}
            >
              <ArrowLeft className="w-5 h-5" style={{ color: '#FFFFFF' }} />
              <span className="text-sm font-medium" style={{ color: '#FFFFFF' }}>Back</span>
            </button>

            <h2 className="text-2xl font-semibold mb-8 text-center" style={{ color: 'white' }}>Create your account</h2>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'rgba(199, 69, 69, 0.1)', borderLeft: '4px solid #c74545' }}>
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#c74545' }} />
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#c74545' }}>Registration Failed</p>
                    <p className="text-sm" style={{ color: '#c74545' }}>{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-semibold" style={{ color: '#D1D5DB' }}>First Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border-2 transition-all focus:outline-none"
                    placeholder="First name"
                    value={form.first_name}
                    onChange={set('first_name')}
                    disabled={loading}
                    required
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#d4a24e'
                    }}
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-semibold" style={{ color: '#D1D5DB' }}>Last Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border-2 transition-all focus:outline-none"
                    placeholder="Last name"
                    value={form.last_name}
                    onChange={set('last_name')}
                    disabled={loading}
                    required
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#d4a24e'
                    }}
                  />
                </div>
              </div>

              {/* Contact Field (GBox Account) */}
              <div>
                <label className="block mb-2 text-sm font-semibold" style={{ color: '#D1D5DB' }}>GBox Account</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 rounded-lg border-2 transition-all focus:outline-none"
                  placeholder="ahlastname@gbox.adnu.edu.ph"
                  value={form.email}
                  onChange={set('email')}
                  disabled={loading}
                  required
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#d4a24e'
                  }}
                />
              </div>

              {/* Password Field */}
              <div>
                <label className="block mb-2 text-sm font-semibold" style={{ color: '#D1D5DB' }}>Create Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-2 rounded-lg border-2 transition-all focus:outline-none"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={set('password')}
                  disabled={loading}
                  required
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#d4a24e'
                  }}
                />
                <p className="text-xs text-slate-600 mt-1">At least 8 characters</p>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block mb-2 text-sm font-semibold" style={{ color: '#D1D5DB' }}>Confirm Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-2 rounded-lg border-2 transition-all focus:outline-none"
                  placeholder="••••••••"
                  disabled={loading}
                  required
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#d4a24e'
                  }}
                />
              </div>

              {/* Register Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 font-semibold rounded-lg transition-all mt-8"
                style={{
                  backgroundColor: '#1a2942',
                  color: '#FFFFFF'
                }}
              >
                {loading ? (
                  <>
                    <span className="inline-block mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                    Creating account...
                  </>
                ) : (
                  'Sign Up'
                )}
              </button>
            </form>

            {/* Sign In Link */}
            <div className="text-center mt-6 pt-6" style={{ borderTop: '1px solid rgba(212, 162, 78, 0.3)' }}>
              <p className="text-sm" style={{ color: '#D1D5DB' }}>
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-semibold hover:opacity-80 transition-all"
                  style={{ color: '#d4a24e' }}
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
