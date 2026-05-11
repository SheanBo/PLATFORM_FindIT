import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { Search } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username:'', email:'', password:'', first_name:'', last_name:'', student_id:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await register(form);
      navigate('/login', { state: { message: 'Account created! Please log in.' } });
    } catch (err) { setError(err.response?.data?.error || 'Registration failed'); }
    finally { setLoading(false); }
  };

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 text-sm">FindIT — OSA Lost & Found</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">First Name</label><input className="input" value={form.first_name} onChange={set('first_name')} required /></div>
            <div><label className="label">Last Name</label><input className="input" value={form.last_name} onChange={set('last_name')} required /></div>
          </div>
          <div><label className="label">Student ID</label><input className="input" placeholder="e.g. 2021-00001" value={form.student_id} onChange={set('student_id')} /></div>
          <div><label className="label">Username</label><input className="input" value={form.username} onChange={set('username')} required /></div>
          <div><label className="label">Email</label><input className="input" type="email" placeholder="yourname@gbox.adnu.edu.ph" value={form.email} onChange={set('email')} required /></div>
          <div><label className="label">Password</label><input className="input" type="password" value={form.password} onChange={set('password')} required /></div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">Already have an account? <Link to="/login" className="text-blue-600 hover:underline font-medium">Sign In</Link></p>
      </div>
    </div>
  );
}
