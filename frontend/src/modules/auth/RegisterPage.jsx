import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { Search, AlertCircle, CheckCircle } from 'lucide-react';

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
    <div className="min-h-screen gradient-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-secondary bg-opacity-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-secondary" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-slate-200 text-sm">Join FindIT — Lost & Found System</p>
        </div>

        {/* Registration Card */}
        <div className="card shadow-2xl">
          {/* Error Alert */}
          {error && (
            <div className="alert alert-error mb-6">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <div className="alert-title">Registration Failed</div>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">First Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="First name"
                  value={form.first_name}
                  onChange={set('first_name')}
                  disabled={loading}
                  required
                />
              </div>
              <div>
                <label className="label">Last Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Last name"
                  value={form.last_name}
                  onChange={set('last_name')}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Student ID Field */}
            <div>
              <label className="label">Student ID</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. 2024-00001"
                value={form.student_id}
                onChange={set('student_id')}
                disabled={loading}
              />
              <p className="help-text">Optional — helps us identify you</p>
            </div>

            {/* Username Field */}
            <div>
              <label className="label">Username</label>
              <input
                type="text"
                className="input"
                placeholder="Choose a username"
                value={form.username}
                onChange={set('username')}
                disabled={loading}
                required
              />
            </div>

            {/* Email Field */}
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@gbox.adnu.edu.ph"
                value={form.email}
                onChange={set('email')}
                disabled={loading}
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={set('password')}
                disabled={loading}
                required
              />
              <p className="help-text">Use a strong password with mixed case</p>
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base mt-6"
            >
              {loading ? (
                <>
                  <span className="loading-spinner" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="text-center mt-6 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-secondary font-semibold hover:text-opacity-80 transition-all"
              >
                Sign in here
              </Link>
            </p>
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
