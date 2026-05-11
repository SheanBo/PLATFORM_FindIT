import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Item Name *</label>
          <input className="input" {...register('item_name', { required: 'Required' })} placeholder="e.g. Black iPhone 14" />
          {errors.item_name && <p className="text-red-500 text-xs mt-1">{errors.item_name.message}</p>}
        </div>
        <div>
          <label className="label">Category *</label>
          <select className="input" {...register('category_id', { required: 'Required' })}>
            <option value="">Select</option>
            {categories.map(c => <option key={c.Category_ID} value={c.Category_ID}>{c.Category_Name.replace(/_/g,' ')}</option>)}
          </select>
          {errors.category_id && <p className="text-red-500 text-xs mt-1">{errors.category_id.message}</p>}
        </div>
        <div>
          <label className="label">Color *</label>
          <select className="input" {...register('item_color', { required: 'Required' })}>
            <option value="">Select</option>
            {COLORS.map(c => <option key={c}>{c}</option>)}
          </select>
          {errors.item_color && <p className="text-red-500 text-xs mt-1">{errors.item_color.message}</p>}
        </div>
        <div>
          <label className="label">Brand</label>
          <input className="input" {...register('item_brand')} placeholder="Optional" />
        </div>
        <div>
          <label className="label">Size</label>
          <input className="input" {...register('item_size')} placeholder="Optional" />
        </div>
        <div>
          <label className="label">Date Found *</label>
          <input className="input" type="date" max={new Date().toISOString().split('T')[0]} {...register('date_found', { required: 'Required' })} />
          {errors.date_found && <p className="text-red-500 text-xs mt-1">{errors.date_found.message}</p>}
        </div>
        <div>
          <label className="label">Location Found *</label>
          <select className="input" {...register('location_id', { required: 'Required' })}>
            <option value="">Select</option>
            {locations.map(l => <option key={l.Location_ID} value={l.Location_ID}>{l.Place_Name}</option>)}
          </select>
          {errors.location_id && <p className="text-red-500 text-xs mt-1">{errors.location_id.message}</p>}
        </div>
        <div>
          <label className="label">Storage Type *</label>
          <select className="input" {...register('storage_type', { required: 'Required' })}>
            <option value="">Select</option>
            <option value="Office_Safe">Office Safe (valuables)</option>
            <option value="Locker">Locker (other items)</option>
          </select>
          {errors.storage_type && <p className="text-red-500 text-xs mt-1">{errors.storage_type.message}</p>}
        </div>
        <div>
          <label className="label">Storage Section</label>
          <select className="input" {...register('section_id')}>
            <option value="">Select section</option>
            {filteredSections.map(s => (
              <option key={s.Section_ID} value={s.Section_ID} disabled={s.Current_Load >= s.Capacity}>
                {s.Section_Name} ({s.Current_Load}/{s.Capacity})
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className="label">Finder Info</label>
          <input className="input" {...register('found_by_contact')} placeholder="Finder name & contact (if walk-in)" />
        </div>
        <div className="col-span-2">
          <label className="label">Description *</label>
          <textarea className="input" rows={3} {...register('item_description', { required: 'Required' })} placeholder="Describe the item..." />
          {errors.item_description && <p className="text-red-500 text-xs mt-1">{errors.item_description.message}</p>}
        </div>
        <div className="col-span-2">
          <label className="label">Photo</label>
          <input className="input" type="file" accept="image/*" {...register('photo')} />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Registering...' : 'Register Item'}</button>
      </div>
    </form>
  );
}
