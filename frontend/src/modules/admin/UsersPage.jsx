import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { useToast } from '../../lib/ToastContext';
import { useDebounce } from '../../lib/useDebounce';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHead, Surface, Badge, Btn } from '../../components/ui/kit';
import { Plus, Search, Power, UserCog } from 'lucide-react';

function CreateStaffForm({ onSuccess, onCancel }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', username: '', password: '', department: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    setLoading(true);
    try {
      await api.post('/findit-dashboard/users', { ...form, username: form.username.trim() || form.email });
      toast('Staff account created', 'success');
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Could not create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <div role="alert" className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(210,105,30,0.08)', color: 'var(--status-terracotta)', border: '1px solid var(--status-terracotta)' }}>
          {error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="u-first" className="label mb-1.5">First name</label>
          <input id="u-first" className="input" value={form.first_name} onChange={set('first_name')} required />
        </div>
        <div>
          <label htmlFor="u-last" className="label mb-1.5">Last name</label>
          <input id="u-last" className="input" value={form.last_name} onChange={set('last_name')} required />
        </div>
      </div>

      <div>
        <label htmlFor="u-email" className="label mb-1.5">GBox account</label>
        <input id="u-email" type="email" className="input" placeholder="name@gbox.adnu.edu.ph" value={form.email} onChange={set('email')} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="u-username" className="label mb-1.5">Username <span className="text-rust-600 font-normal">(optional)</span></label>
          <input id="u-username" className="input" placeholder="Defaults to GBox address" value={form.username} onChange={set('username')} />
        </div>
        <div>
          <label htmlFor="u-password" className="label mb-1.5">Temporary password</label>
          <input id="u-password" type="password" className="input" placeholder="At least 8 characters" value={form.password} onChange={set('password')} required />
        </div>
      </div>

      <div>
        <label htmlFor="u-dept" className="label mb-1.5">Department <span className="text-rust-600 font-normal">(optional)</span></label>
        <input id="u-dept" className="input" value={form.department} onChange={set('department')} />
      </div>

      <div className="flex gap-3 pt-4" style={{ borderTop: '1px solid var(--gold-300)' }}>
        <button type="button" onClick={onCancel} className="btn-ghost border flex-1" style={{ borderColor: 'var(--gold-300)' }}>Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Creating…' : 'Create staff account'}</button>
      </div>
    </form>
  );
}

export default function UsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);

  const load = () => {
    setLoading(true);
    // Admin manages Staff only — students are handled at the database level.
    api.get('/findit-dashboard/users', { params: { search: debouncedSearch, role: 'Staff', page, limit: 10 } })
      .then((r) => { setUsers(r.data.data); setPagination(r.data.pagination); })
      .catch(() => toast('Failed to load staff accounts', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [debouncedSearch, page]);

  const toggleActive = async (u) => {
    try {
      await api.put(`/findit-dashboard/users/${u.User_ID}/toggle`);
      load();
    } catch {
      toast('Could not update account', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-8">
        <PageHead
          title="Staff accounts"
          subtitle="Create and manage staff — students self-register"
          actions={<Btn variant="primary" icon={Plus} onClick={() => setShowCreate(true)}>New staff account</Btn>}
        />

        <div className="relative mb-4 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-rust-600" />
          <input className="input pl-9" placeholder="Search by name, username, or email" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>

        {loading ? (
          <div className="grid gap-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl skeleton" />)}</div>
        ) : users.length === 0 ? (
          <EmptyState icon={UserCog} title="No staff accounts yet" description="Create a staff account so colleagues can verify claims and manage items." actionLabel="New staff account" onAction={() => setShowCreate(true)} />
        ) : (
          <Surface className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr style={{ backgroundColor: 'rgba(212,162,78,0.08)', borderBottom: '1px solid var(--gold-300)' }}>
                    {['Name', 'Username', 'Email', 'Status', ''].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-rust-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.User_ID} style={{ borderTop: i === 0 ? 'none' : '1px solid rgba(212,162,78,0.18)' }}>
                      <td className="px-5 py-3 font-semibold text-navy-900">{u.First_Name} {u.Last_Name}</td>
                      <td className="px-5 py-3 text-rust-600">{u.Username}</td>
                      <td className="px-5 py-3 text-rust-600">{u.Email}</td>
                      <td className="px-5 py-3">
                        <Badge tone={u.Is_Active === 'Y' ? 'success' : 'danger'}>{u.Is_Active === 'Y' ? 'Active' : 'Inactive'}</Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => toggleActive(u)} className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border hover:bg-cream-100" style={{ borderColor: 'var(--gold-300)', color: 'var(--navy-900)' }} title={u.Is_Active === 'Y' ? 'Deactivate' : 'Activate'}>
                          <Power className="w-3.5 h-3.5" /> {u.Is_Active === 'Y' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3" style={{ borderTop: '1px solid rgba(212,162,78,0.18)' }}>
              <Pagination pagination={pagination} onPageChange={setPage} />
            </div>
          </Surface>
        )}
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create staff account" size="md">
        <CreateStaffForm onSuccess={() => { setShowCreate(false); load(); }} onCancel={() => setShowCreate(false)} />
      </Modal>
    </div>
  );
}
