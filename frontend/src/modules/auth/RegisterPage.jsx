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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mx-auto mb-4">
            <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold text-slate-900">F</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-1">FindIT</h1>
          <p className="text-amber-200 text-sm">Create your account to report and recover items</p>
        </div>

        {/* Registration Card */}
        <div className="card shadow-2xl">
          <h2 className="text-xl font-semibold text-slate-900 mb-6 text-center">Create your account</h2>

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
              <label className="label">Student ID Number</label>
              <input
                type="text"
                className="input"
                placeholder="202401129"
                value={form.student_id}
                onChange={set('student_id')}
                disabled={loading}
              />
              <p className="help-text">Optional — helps us identify you</p>
            </div>

            {/* Contact Field (GBox Account) */}
            <div>
              <label className="label">GBox Account</label>
              <input
                type="email"
                className="input"
                placeholder="ahlastname@gbox.adnu.edu.ph"
                value={form.email}
                onChange={set('email')}
                disabled={loading}
                required
              />
            </div>

            {/* Username Field */}
            <div>
              <label className="label">Contact Number</label>
              <input
                type="tel"
                className="input"
                placeholder="09xxxxxxxxx"
                value={form.username}
                onChange={set('username')}
                disabled={loading}
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="label">Create Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
                disabled={loading}
                required
              />
              <p className="help-text">At least 8 characters</p>
            </div>

            {/* Confirm Password (if needed) */}
            <div>
              <label className="label">Confirm Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                disabled={loading}
                required
              />
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
                'Sign Up'
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="text-center mt-6 pt-6 border-t border-amber-200">
            <p className="text-sm text-amber-900">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-amber-600 font-semibold hover:text-amber-700 transition-all"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-amber-200 mt-8">
          © 2026 FindIT. All rights reserved.
        </p>
      </div>
    </div>
  );
}
