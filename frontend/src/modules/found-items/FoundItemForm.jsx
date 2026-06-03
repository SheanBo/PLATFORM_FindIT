import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Upload } from 'lucide-react';
import api from '../../lib/api';

const COLORS = ['Black','White','Gray','Brown','Red','Blue','Green','Yellow','Orange','Purple','Pink','Gold','Silver','Multicolor'];

export default function FoundItemForm({ onSuccess, onCancel }) {
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const storageType = watch('storage_type');

  useEffect(() => {
    Promise.all([
      api.get('/findit-dashboard/categories'),
      api.get('/findit-dashboard/locations'),
      api.get('/findit-storage'),
    ]).then(([c, l, s]) => {
      setCategories(c.data.data); setLocations(l.data.data); setSections(s.data.data);
    });
  }, []);

  const filteredSections = sections.filter(s => !storageType || s.Storage_Type === storageType);

  const onSubmit = async (data) => {
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== '') fd.append(k, v); });
      if (data.photo?.[0]) fd.append('photo', data.photo[0]);
      await api.post('/findit-found-items', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onSuccess();
    } catch (err) { setError(err.response?.data?.error || 'Failed to register item'); }
    finally { setLoading(false); }
  };

  return (
    <div className="rounded-lg overflow-hidden shadow-lg border border-gray-200" style={{ backgroundColor: 'var(--cream-100)' }}>
      {/* Header */}
      <div className="p-4 rounded-t-lg flex items-center gap-2" style={{ backgroundColor: 'rgba(212, 162, 78, 0.15)', borderBottom: '3px solid var(--navy-900)' }}>
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--navy-900)' }}></div>
        <h3 className="text-lg font-bold" style={{ color: 'var(--navy-900)' }}>Register Found Item</h3>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        {error && (
          <div className="p-4 rounded-lg text-sm" style={{ backgroundColor: '#F5E5D7', color: 'var(--status-terracotta)', border: '1px solid var(--status-terracotta)' }}>
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Item Name */}
          <div className="col-span-2">
            <label className="label mb-2">Item Name</label>
            <input className="input" {...register('item_name', { required: 'Required' })} placeholder="Brown Leather Wallet" style={{ borderColor: errors.item_name ? 'var(--status-terracotta)' : 'var(--gold-300)' }} />
            {errors.item_name && <p className="text-xs mt-1" style={{ color: 'var(--status-terracotta)' }}>{errors.item_name.message}</p>}
          </div>

          {/* Category & Color */}
          <div>
            <label className="label mb-2">Category</label>
            <select className="input" {...register('category_id', { required: 'Required' })} style={{ borderColor: errors.category_id ? 'var(--status-terracotta)' : 'var(--gold-300)' }}>
              <option value="">Select</option>
              {categories.map(c => <option key={c.Category_ID} value={c.Category_ID}>{c.Category_Name.replace(/_/g,' ')}</option>)}
            </select>
            {errors.category_id && <p className="text-xs mt-1" style={{ color: 'var(--status-terracotta)' }}>{errors.category_id.message}</p>}
          </div>
          <div>
            <label className="label mb-2">Color</label>
            <select className="input" {...register('item_color', { required: 'Required' })} style={{ borderColor: errors.item_color ? 'var(--status-terracotta)' : 'var(--gold-300)' }}>
              <option value="">Select</option>
              {COLORS.map(c => <option key={c}>{c}</option>)}
            </select>
            {errors.item_color && <p className="text-xs mt-1" style={{ color: 'var(--status-terracotta)' }}>{errors.item_color.message}</p>}
          </div>

          {/* Brand & Size */}
          <div>
            <label className="label mb-2">Brand</label>
            <input className="input" {...register('item_brand')} placeholder="Coach, Apple, etc." style={{ borderColor: 'var(--gold-300)' }} />
          </div>
          <div>
            <label className="label mb-2">Size</label>
            <input className="input" {...register('item_size')} placeholder="Small, Medium, Large" style={{ borderColor: 'var(--gold-300)' }} />
          </div>

          {/* Date Found & Location */}
          <div>
            <label className="label mb-2">Date Found</label>
            <input className="input" type="date" max={new Date().toISOString().split('T')[0]} {...register('date_found', { required: 'Required' })} style={{ borderColor: errors.date_found ? 'var(--status-terracotta)' : 'var(--gold-300)' }} />
            {errors.date_found && <p className="text-xs mt-1" style={{ color: 'var(--status-terracotta)' }}>{errors.date_found.message}</p>}
          </div>
          <div>
            <label className="label mb-2">Location Found</label>
            <select className="input" {...register('location_id', { required: 'Required' })} style={{ borderColor: errors.location_id ? 'var(--status-terracotta)' : 'var(--gold-300)' }}>
              <option value="">Select</option>
              {locations.map(l => <option key={l.Location_ID} value={l.Location_ID}>{l.Place_Name}</option>)}
            </select>
            {errors.location_id && <p className="text-xs mt-1" style={{ color: 'var(--status-terracotta)' }}>{errors.location_id.message}</p>}
          </div>

          {/* Storage Assignment */}
          <div>
            <label className="label mb-2">Storage Type</label>
            <select className="input" {...register('storage_type', { required: 'Required' })} style={{ borderColor: errors.storage_type ? 'var(--status-terracotta)' : 'var(--gold-300)' }}>
              <option value="">Select</option>
              <option value="Office_Safe">Office Safe (valuables)</option>
              <option value="Locker">Locker (other items)</option>
            </select>
            {errors.storage_type && <p className="text-xs mt-1" style={{ color: 'var(--status-terracotta)' }}>{errors.storage_type.message}</p>}
          </div>
          <div>
            <label className="label mb-2">Storage Assignment</label>
            <select className="input" {...register('section_id')} style={{ borderColor: 'var(--gold-300)' }}>
              <option value="">Select section</option>
              {filteredSections.map(s => (
                <option key={s.Section_ID} value={s.Section_ID} disabled={s.Current_Load >= s.Capacity}>
                  {s.Section_Name} ({s.Current_Load}/{s.Capacity})
                </option>
              ))}
            </select>
          </div>

          {/* Finder Info */}
          <div className="col-span-2">
            <label className="label mb-2">Finder Info</label>
            <input className="input" {...register('found_by_contact')} placeholder="Finder name & contact (if walk-in)" style={{ borderColor: 'var(--gold-300)' }} />
          </div>

          {/* Description */}
          <div className="col-span-2">
            <label className="label mb-2">Description</label>
            <textarea className="input" rows={3} {...register('item_description', { required: 'Required' })} placeholder="Describe the item in detail..." style={{ borderColor: errors.item_description ? 'var(--status-terracotta)' : 'var(--gold-300)' }} />
            {errors.item_description && <p className="text-xs mt-1" style={{ color: 'var(--status-terracotta)' }}>{errors.item_description.message}</p>}
          </div>

          {/* Photo */}
          <div className="col-span-2">
            <label className="label mb-2">Photo</label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center" style={{ borderColor: 'var(--gold-300)', backgroundColor: 'rgba(212, 162, 78, 0.05)' }}>
              <Upload className="w-5 h-5 mx-auto mb-2" style={{ color: 'var(--gold-500)' }} />
              <p className="text-xs mb-2" style={{ color: 'var(--rust-600)' }}>Upload photo</p>
              <input className="hidden" type="file" accept="image/*" {...register('photo')} id="photo" />
              <label htmlFor="photo" className="cursor-pointer text-xs font-semibold" style={{ color: 'var(--navy-900)' }}>Choose file</label>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4 border-t" style={{ borderColor: 'var(--gold-300)' }}>
          <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-lg font-semibold transition-all border" style={{ color: 'var(--brown-900)', borderColor: 'var(--gold-300)', backgroundColor: 'white' }}>Cancel</button>
          <button type="submit" disabled={loading} className="flex-1 py-3 rounded-lg font-semibold text-white transition-all" style={{ backgroundColor: 'var(--navy-900)' }}>{loading ? 'Registering...' : 'Register Item'}</button>
        </div>
      </form>
    </div>
  );
}
