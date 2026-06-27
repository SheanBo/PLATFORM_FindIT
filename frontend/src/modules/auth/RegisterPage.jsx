import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { AlertCircle, ArrowLeft, User, Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const inputStyle = {
  backgroundColor: 'rgba(251,243,220,0.08)',
  borderColor: 'rgba(212,162,78,0.5)',
  color: 'var(--cream-100)',
};

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', first_name: '', last_name: '', student_id: '' });
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    if (form.password !== confirm) return setError('Passwords do not match.');

    setLoading(true);
    try {
      // Default the username to the GBox address if one isn't set separately.
      await register({ ...form, username: form.username || form.email });
      navigate('/login', { state: { message: 'Account created successfully! Please log in with your credentials.' } });
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center relative"
      style={{ backgroundImage: 'url(/ateneo.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}
    >
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(105deg, rgba(22,33,61,0.92) 0%, rgba(22,33,61,0.72) 38%, rgba(22,33,61,0.30) 66%, rgba(22,33,61,0.05) 100%)' }}
      />

      <div className="relative z-10 w-full flex justify-center md:justify-start px-6 sm:px-10 lg:pl-20 py-12">
        <div
          className="w-full max-w-md rounded-2xl p-8 sm:p-10"
          style={{
            backgroundColor: 'rgba(22,33,61,0.45)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(242,205,107,0.25)',
            boxShadow: '0 24px 60px -24px rgba(0,0,0,0.65)',
          }}
        >
          <Link to="/login" className="inline-flex items-center gap-2 text-sm mb-6 hover:opacity-80 transition-opacity" style={{ color: 'rgba(251,243,220,0.75)' }}>
            <ArrowLeft className="w-4 h-4" /> Back to sign in
          </Link>

          <div className="mb-6 flex items-center gap-3">
            <img src="/FindIT_Logo.png" alt="FindIT Logo" className="w-10 h-10 object-contain flex-shrink-0" />
            <h1 className="text-2xl font-bold" style={{ color: 'var(--cream-100)' }}>FindIT</h1>
          </div>

          <div className="mb-7">
            <h2 className="text-xl font-bold" style={{ color: 'var(--cream-100)' }}>Create your account</h2>
            <p className="text-sm mt-1" style={{ color: 'rgba(251,243,220,0.7)' }}>Join the OSA Lost &amp; Found system</p>
          </div>

          {error && (
            <div role="alert" className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'rgba(199, 69, 69, 0.1)', borderLeft: '4px solid var(--status-terracotta)' }}>
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--status-terracotta)' }} />
                <p className="text-sm" style={{ color: 'var(--status-terracotta)' }}>{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="first_name" className="block mb-2 text-sm font-medium" style={{ color: 'var(--cream-100)' }}>First name</label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--gold-500)' }} aria-hidden="true" />
                  <input id="first_name" className="w-full pl-11 pr-3 py-3 rounded-lg border-2 focus:outline-none" placeholder="First name" value={form.first_name} onChange={set('first_name')} disabled={loading} required style={inputStyle} />
                </div>
              </div>
              <div>
                <label htmlFor="last_name" className="block mb-2 text-sm font-medium" style={{ color: 'var(--cream-100)' }}>Last name</label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--gold-500)' }} aria-hidden="true" />
                  <input id="last_name" className="w-full pl-11 pr-3 py-3 rounded-lg border-2 focus:outline-none" placeholder="Last name" value={form.last_name} onChange={set('last_name')} disabled={loading} required style={inputStyle} />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block mb-2 text-sm font-medium" style={{ color: 'var(--cream-100)' }}>GBox account</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--gold-500)' }} aria-hidden="true" />
                <input id="email" type="email" autoComplete="email" className="w-full pl-11 pr-4 py-3 rounded-lg border-2 focus:outline-none" placeholder="lastname@gbox.adnu.edu.ph" value={form.email} onChange={set('email')} disabled={loading} required style={inputStyle} />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block mb-2 text-sm font-medium" style={{ color: 'var(--cream-100)' }}>Create password</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--gold-500)' }} aria-hidden="true" />
                <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" className="w-full pl-11 pr-12 py-3 rounded-lg border-2 focus:outline-none" placeholder="At least 8 characters" value={form.password} onChange={set('password')} disabled={loading} required style={inputStyle} />
                <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 hover:opacity-80" style={{ color: 'var(--gold-500)' }} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm" className="block mb-2 text-sm font-medium" style={{ color: 'var(--cream-100)' }}>Confirm password</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--gold-500)' }} aria-hidden="true" />
                <input id="confirm" type={showPassword ? 'text' : 'password'} autoComplete="new-password" className="w-full pl-11 pr-4 py-3 rounded-lg border-2 focus:outline-none" placeholder="Re-enter your password" value={confirm} onChange={(e) => setConfirm(e.target.value)} disabled={loading} required style={inputStyle} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 font-semibold rounded-lg transition-all mt-6 hover:brightness-95 shadow-lg disabled:opacity-70"
              style={{ backgroundColor: 'var(--gold-500)', color: 'var(--navy-900)' }}
            >
              {loading ? (
                <>
                  <span className="inline-block mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                  Creating account…
                </>
              ) : 'Sign Up'}
            </button>
          </form>

          <div className="text-center mt-6 pt-6" style={{ borderTop: '1px solid rgba(212,162,78,0.3)' }}>
            <p className="text-sm" style={{ color: 'var(--cream-100)' }}>
              Already have an account?{' '}
              <Link to="/login" className="font-semibold hover:opacity-80 transition-all" style={{ color: 'var(--gold-500)' }}>Sign in</Link>
            </p>
            <p className="text-xs mt-4 flex items-center justify-center gap-1.5" style={{ color: 'rgba(251,243,220,0.6)' }}>
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              Secure sign-up for Ateneo de Naga accounts
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
