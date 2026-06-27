import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Upload, X } from 'lucide-react';
import api from '../../lib/api';

const CATEGORIES = ['Wallet','Phone','ID_Card','Keys','Umbrella','Bag','Clothing','Laptop','Tablet','Documents','Jewelry','Eyewear','Water_Bottle','Food_Container','Electronics_Accessories'];
const COLORS = ['Black','White','Gray','Brown','Red','Blue','Green','Yellow','Orange','Purple','Pink','Gold','Silver','Multicolor'];

export default function LostReportForm({ onSuccess, onCancel, initial }) {
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photo, setPhoto] = useState(null);
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: initial || {} });

  useEffect(() => {
    Promise.all([api.get('/findit-dashboard/categories'), api.get('/findit-dashboard/locations')])
      .then(([c, l]) => { setCategories(c.data.data); setLocations(l.data.data); });
  }, []);

  const handleFileChange = (e) => {
    setPhoto(e.target.files?.[0] || null);
  };

  const clearFile = () => setPhoto(null);

  const onSubmit = async (data) => {
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (photo) fd.append('photo', photo);
      await api.post('/findit-lost-reports', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onSuccess();
    } catch (err) { setError(err.response?.data?.error || 'Failed to submit'); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div role="alert" className="p-4 rounded-lg text-sm" style={{ backgroundColor: 'rgba(194, 116, 31, 0.08)', color: 'var(--status-terracotta)', border: '1px solid var(--status-terracotta)' }}>
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Item Name */}
          <div className="col-span-2">
            <label htmlFor="item_name" className="label mb-2">What's missing?</label>
            <p className="text-xs mb-2" style={{ color: 'var(--rust-600)' }}>Be specific — help us find exactly what you lost</p>
            <input id="item_name" className="input" {...register('item_name', { required: 'Required' })} placeholder="e.g., Blue umbrella with brown leather handle" aria-invalid={errors.item_name ? 'true' : undefined} aria-describedby={errors.item_name ? 'item_name-error' : undefined} style={{ borderColor: errors.item_name ? 'var(--status-terracotta)' : 'var(--gold-300)' }} />
            {errors.item_name && <p id="item_name-error" role="alert" className="text-xs mt-1" style={{ color: 'var(--status-terracotta)' }}>{errors.item_name.message}</p>}
          </div>

          {/* Category & Color */}
          <div>
            <label htmlFor="category_id" className="label mb-2">Category</label>
            <select id="category_id" className="input" {...register('category_id', { required: 'Required' })} aria-invalid={errors.category_id ? 'true' : undefined} aria-describedby={errors.category_id ? 'category_id-error' : undefined} style={{ borderColor: errors.category_id ? 'var(--status-terracotta)' : 'var(--gold-300)' }}>
              <option value="">Select category</option>
              {categories.map(c => <option key={c.Category_ID} value={c.Category_ID}>{c.Category_Name.replace(/_/g,' ')}</option>)}
            </select>
            {errors.category_id && <p id="category_id-error" role="alert" className="text-xs mt-1" style={{ color: 'var(--status-terracotta)' }}>{errors.category_id.message}</p>}
          </div>
          <div>
            <label htmlFor="item_color" className="label mb-2">Color</label>
            <input id="item_color" className="input" {...register('item_color', { required: 'Required' })} placeholder="e.g., Black, Blue, Red" list="colors" aria-invalid={errors.item_color ? 'true' : undefined} aria-describedby={errors.item_color ? 'item_color-error' : undefined} style={{ borderColor: errors.item_color ? 'var(--status-terracotta)' : 'var(--gold-300)' }} />
            <datalist id="colors">
              {COLORS.map(c => <option key={c} value={c} />)}
            </datalist>
            {errors.item_color && <p id="item_color-error" role="alert" className="text-xs mt-1" style={{ color: 'var(--status-terracotta)' }}>{errors.item_color.message}</p>}
          </div>

          {/* Brand & Size */}
          <div>
            <label htmlFor="item_brand" className="label mb-2">Brand <span style={{ color: 'var(--rust-600)' }}>(Optional)</span></label>
            <input id="item_brand" className="input" {...register('item_brand')} placeholder="Coach, Apple, etc." style={{ borderColor: 'var(--gold-300)' }} />
          </div>
          <div>
            <label htmlFor="item_size" className="label mb-2">Size <span style={{ color: 'var(--rust-600)' }}>(Optional)</span></label>
            <input id="item_size" className="input" {...register('item_size')} placeholder="Small, Large, etc." style={{ borderColor: 'var(--gold-300)' }} />
          </div>

          {/* Date Lost & Location */}
          <div>
            <label htmlFor="date_lost" className="label mb-2">When did you lose it?</label>
            <input id="date_lost" className="input" type="date" max={new Date().toISOString().split('T')[0]} {...register('date_lost', { required: 'Required' })} aria-invalid={errors.date_lost ? 'true' : undefined} aria-describedby={errors.date_lost ? 'date_lost-error' : undefined} style={{ borderColor: errors.date_lost ? 'var(--status-terracotta)' : 'var(--gold-300)' }} />
            {errors.date_lost && <p id="date_lost-error" role="alert" className="text-xs mt-1" style={{ color: 'var(--status-terracotta)' }}>{errors.date_lost.message}</p>}
          </div>
          <div>
            <label htmlFor="location_id" className="label mb-2">Where was it?</label>
            <select id="location_id" className="input" {...register('location_id', { required: 'Required' })} aria-invalid={errors.location_id ? 'true' : undefined} aria-describedby={errors.location_id ? 'location_id-error' : undefined} style={{ borderColor: errors.location_id ? 'var(--status-terracotta)' : 'var(--gold-300)' }}>
              <option value="">Select location</option>
              {locations.map(l => <option key={l.Location_ID} value={l.Location_ID}>{l.Place_Name}</option>)}
            </select>
            {errors.location_id && <p id="location_id-error" role="alert" className="text-xs mt-1" style={{ color: 'var(--status-terracotta)' }}>{errors.location_id.message}</p>}
          </div>

          {/* Location Details */}
          <div className="col-span-2">
            <label htmlFor="detail_location" className="label mb-2">Specific Location Details</label>
            <input id="detail_location" className="input" {...register('detail_location')} placeholder="Near the entrance, 2nd floor" style={{ borderColor: 'var(--gold-300)' }} />
          </div>

          {/* Description */}
          <div className="col-span-2">
            <label htmlFor="item_description" className="label mb-2">Help us find it</label>
            <p className="text-xs mb-2" style={{ color: 'var(--rust-600)' }}>Include color, brand, condition, and any identifying marks</p>
            <textarea id="item_description" className="input" rows={3} {...register('item_description', { required: 'Required' })} placeholder="e.g., Tan leather bifold, Coach brand, has my student ID inside..." aria-invalid={errors.item_description ? 'true' : undefined} aria-describedby={errors.item_description ? 'item_description-error' : undefined} style={{ borderColor: errors.item_description ? 'var(--status-terracotta)' : 'var(--gold-300)' }} />
            {errors.item_description && <p id="item_description-error" role="alert" className="text-xs mt-1" style={{ color: 'var(--status-terracotta)' }}>{errors.item_description.message}</p>}
          </div>

          {/* Contact & Photo */}
          <div>
            <label htmlFor="contact_information" className="label mb-2">How to reach you</label>
            <p className="text-xs mb-2" style={{ color: 'var(--rust-600)' }}>Phone or email — we'll contact you if it's found</p>
            <input id="contact_information" className="input" {...register('contact_information', { required: 'Required' })} placeholder="e.g., 09171234567 or name@ateneo.edu.ph" aria-invalid={errors.contact_information ? 'true' : undefined} aria-describedby={errors.contact_information ? 'contact_information-error' : undefined} style={{ borderColor: errors.contact_information ? 'var(--status-terracotta)' : 'var(--gold-300)' }} />
            {errors.contact_information && <p id="contact_information-error" role="alert" className="text-xs mt-1" style={{ color: 'var(--status-terracotta)' }}>{errors.contact_information.message}</p>}
          </div>
          <div className="col-span-2">
            <label className="label mb-2">Photo <span style={{ color: 'var(--rust-600)' }}>(Optional)</span></label>
            {photo && (
              <div className="mb-4 border-2 border-solid rounded-lg p-3 flex items-center justify-between" style={{ borderColor: 'var(--status-green)', backgroundColor: 'rgba(47, 158, 88, 0.05)' }}>
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4" style={{ color: 'var(--status-green)' }} />
                  <span className="text-xs" style={{ color: 'var(--navy-900)' }}>{photo.name}</span>
                </div>
                <button type="button" onClick={clearFile} className="p-1 hover:opacity-70" aria-label="Remove photo">
                  <X className="w-4 h-4" style={{ color: 'var(--rust-600)' }} aria-hidden="true" />
                </button>
              </div>
            )}
            <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-opacity-10 transition-all" style={{ borderColor: 'var(--gold-300)', backgroundColor: 'rgba(212, 162, 78, 0.05)' }}>
              <Upload className="w-5 h-5 mx-auto mb-2" style={{ color: 'var(--gold-500)' }} />
              <p className="text-xs mb-2" style={{ color: 'var(--rust-600)' }}>Upload a photo</p>
              <input className="hidden" type="file" accept="image/*" onChange={handleFileChange} id="photo" />
              <label htmlFor="photo" className="cursor-pointer text-xs font-semibold" style={{ color: 'var(--navy-900)' }}>Choose file</label>
            </div>
          </div>
        </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4 border-t" style={{ borderColor: 'var(--gold-300)' }}>
        <button type="button" onClick={onCancel} className="btn-ghost flex-1">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Submitting...' : 'Submit Report'}</button>
      </div>
    </form>
  );
}
