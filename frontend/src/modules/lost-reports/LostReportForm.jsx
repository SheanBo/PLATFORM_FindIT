import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../lib/api';

const CATEGORIES = ['Wallet','Phone','ID_Card','Keys','Umbrella','Bag','Clothing','Laptop','Tablet','Documents','Jewelry','Eyewear','Water_Bottle','Food_Container','Electronics_Accessories'];
const COLORS = ['Black','White','Gray','Brown','Red','Blue','Green','Yellow','Orange','Purple','Pink','Gold','Silver','Multicolor'];

export default function LostReportForm({ onSuccess, onCancel, initial }) {
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: initial || {} });

  useEffect(() => {
    Promise.all([api.get('/findit-dashboard/categories'), api.get('/findit-dashboard/locations')])
      .then(([c, l]) => { setCategories(c.data.data); setLocations(l.data.data); });
  }, []);

  const onSubmit = async (data) => {
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (data.photo?.[0]) fd.append('photo', data.photo[0]);
      await api.post('/findit-lost-reports', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onSuccess();
    } catch (err) { setError(err.response?.data?.error || 'Failed to submit'); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Item Name *</label>
          <input className="input" {...register('item_name', { required: 'Required' })} placeholder="e.g. Brown Leather Wallet" />
          {errors.item_name && <p className="text-red-500 text-xs mt-1">{errors.item_name.message}</p>}
        </div>
        <div>
          <label className="label">Category *</label>
          <select className="input" {...register('category_id', { required: 'Required' })}>
            <option value="">Select category</option>
            {categories.map(c => <option key={c.Category_ID} value={c.Category_ID}>{c.Category_Name.replace(/_/g,' ')}</option>)}
          </select>
          {errors.category_id && <p className="text-red-500 text-xs mt-1">{errors.category_id.message}</p>}
        </div>
        <div>
          <label className="label">Color *</label>
          <select className="input" {...register('item_color', { required: 'Required' })}>
            <option value="">Select color</option>
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
          <input className="input" {...register('item_size')} placeholder="e.g. Small, Large" />
        </div>
        <div>
          <label className="label">Date Lost *</label>
          <input className="input" type="date" max={new Date().toISOString().split('T')[0]} {...register('date_lost', { required: 'Required' })} />
          {errors.date_lost && <p className="text-red-500 text-xs mt-1">{errors.date_lost.message}</p>}
        </div>
        <div>
          <label className="label">Last Seen Location *</label>
          <select className="input" {...register('location_id', { required: 'Required' })}>
            <option value="">Select location</option>
            {locations.map(l => <option key={l.Location_ID} value={l.Location_ID}>{l.Place_Name}</option>)}
          </select>
          {errors.location_id && <p className="text-red-500 text-xs mt-1">{errors.location_id.message}</p>}
        </div>
        <div className="col-span-2">
          <label className="label">Specific Location Details</label>
          <input className="input" {...register('detail_location')} placeholder="e.g. Near the entrance, 2nd floor" />
        </div>
        <div className="col-span-2">
          <label className="label">Description *</label>
          <textarea className="input" rows={3} {...register('item_description', { required: 'Required' })} placeholder="Describe the item in detail..." />
          {errors.item_description && <p className="text-red-500 text-xs mt-1">{errors.item_description.message}</p>}
        </div>
        <div>
          <label className="label">Contact Number *</label>
          <input className="input" {...register('contact_information', { required: 'Required' })} placeholder="09XXXXXXXXX" />
          {errors.contact_information && <p className="text-red-500 text-xs mt-1">{errors.contact_information.message}</p>}
        </div>
        <div>
          <label className="label">Photo (optional)</label>
          <input className="input" type="file" accept="image/*" {...register('photo')} />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Submitting...' : 'Submit Report'}</button>
      </div>
    </form>
  );
}
