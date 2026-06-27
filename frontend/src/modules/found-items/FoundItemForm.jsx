import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Upload, X } from 'lucide-react';
import api from '../../lib/api';

const COLORS = ['Black','White','Gray','Brown','Red','Blue','Green','Yellow','Orange','Purple','Pink','Gold','Silver','Multicolor'];

export default function FoundItemForm({ onSuccess, onCancel }) {
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photo, setPhoto] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm();
  const storageType = watch('storage_type');
  const categoryId = watch('category_id');

  // Smart storage: when a category is picked, suggest and pre-fill the
  // storage type and least-loaded section (both stay editable).
  useEffect(() => {
    if (!categoryId) { setRecommendation(null); return; }
    let cancelled = false;
    api.get('/findit-storage/recommend', { params: { category_id: categoryId } })
      .then(r => {
        if (cancelled) return;
        setRecommendation(r.data);
        setValue('storage_type', r.data.storage_type);
        setValue('section_id', r.data.section ? String(r.data.section.Section_ID) : '');
      })
      .catch(() => { if (!cancelled) setRecommendation(null); });
    return () => { cancelled = true; };
  }, [categoryId, setValue]);

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

  const handleFileChange = (e) => {
    setPhoto(e.target.files?.[0] || null);
  };

  const clearFile = () => setPhoto(null);

  const onSubmit = async (data) => {
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== '') fd.append(k, v); });
      if (photo) fd.append('photo', photo);
      await api.post('/findit-found-items', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onSuccess();
    } catch (err) { setError(err.response?.data?.error || 'Failed to register item'); }
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
            <label htmlFor="item_name" className="label mb-2">Item found</label>
            <p className="text-xs mb-2" style={{ color: 'var(--rust-600)' }}>Be specific to help identify the owner</p>
            <input id="item_name" className="input" {...register('item_name', { required: 'Required' })} placeholder="e.g., Brown leather wallet with Ateneo ID" aria-invalid={errors.item_name ? 'true' : undefined} aria-describedby={errors.item_name ? 'item_name-error' : undefined} style={{ borderColor: errors.item_name ? 'var(--status-terracotta)' : 'var(--gold-300)' }} />
            {errors.item_name && <p id="item_name-error" role="alert" className="text-xs mt-1" style={{ color: 'var(--status-terracotta)' }}>{errors.item_name.message}</p>}
          </div>

          {/* Category & Color */}
          <div>
            <label htmlFor="category_id" className="label mb-2">Category</label>
            <select id="category_id" className="input" {...register('category_id', { required: 'Required' })} aria-invalid={errors.category_id ? 'true' : undefined} aria-describedby={errors.category_id ? 'category_id-error' : undefined} style={{ borderColor: errors.category_id ? 'var(--status-terracotta)' : 'var(--gold-300)' }}>
              <option value="">Select</option>
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
            <label htmlFor="item_brand" className="label mb-2">Brand <span style={{ color: '#9CA3AF' }}>(Optional)</span></label>
            <input id="item_brand" className="input" {...register('item_brand')} placeholder="Coach, Apple, etc." style={{ borderColor: 'var(--gold-300)' }} />
          </div>
          <div>
            <label htmlFor="item_size" className="label mb-2">Size <span style={{ color: '#9CA3AF' }}>(Optional)</span></label>
            <input id="item_size" className="input" {...register('item_size')} placeholder="Small, Medium, Large" style={{ borderColor: 'var(--gold-300)' }} />
          </div>

          {/* Date Found & Location */}
          <div>
            <label htmlFor="date_found" className="label mb-2">When was it found?</label>
            <input id="date_found" className="input" type="date" max={new Date().toISOString().split('T')[0]} {...register('date_found', { required: 'Required' })} aria-invalid={errors.date_found ? 'true' : undefined} aria-describedby={errors.date_found ? 'date_found-error' : undefined} style={{ borderColor: errors.date_found ? 'var(--status-terracotta)' : 'var(--gold-300)' }} />
            {errors.date_found && <p id="date_found-error" role="alert" className="text-xs mt-1" style={{ color: 'var(--status-terracotta)' }}>{errors.date_found.message}</p>}
          </div>
          <div>
            <label htmlFor="location_id" className="label mb-2">Where was it found?</label>
            <select id="location_id" className="input" {...register('location_id', { required: 'Required' })} aria-invalid={errors.location_id ? 'true' : undefined} aria-describedby={errors.location_id ? 'location_id-error' : undefined} style={{ borderColor: errors.location_id ? 'var(--status-terracotta)' : 'var(--gold-300)' }}>
              <option value="">Select location</option>
              {locations.map(l => <option key={l.Location_ID} value={l.Location_ID}>{l.Place_Name}</option>)}
            </select>
            {errors.location_id && <p id="location_id-error" role="alert" className="text-xs mt-1" style={{ color: 'var(--status-terracotta)' }}>{errors.location_id.message}</p>}
          </div>

          {/* Storage Assignment */}
          <div>
            <label htmlFor="storage_type" className="label mb-2">Storage Type</label>
            <select id="storage_type" className="input" {...register('storage_type', { required: 'Required' })} aria-invalid={errors.storage_type ? 'true' : undefined} aria-describedby={errors.storage_type ? 'storage_type-error' : undefined} style={{ borderColor: errors.storage_type ? 'var(--status-terracotta)' : 'var(--gold-300)' }}>
              <option value="">Select</option>
              <option value="Office_Safe">Office Safe (valuables)</option>
              <option value="Locker">Locker (other items)</option>
            </select>
            {errors.storage_type && <p id="storage_type-error" role="alert" className="text-xs mt-1" style={{ color: 'var(--status-terracotta)' }}>{errors.storage_type.message}</p>}
            {recommendation && (
              <p className="text-xs mt-1" style={{ color: 'var(--status-green)' }}>
                Recommended: {recommendation.storage_type === 'Office_Safe' ? 'Office Safe' : 'Locker'}
                {recommendation.section && ` — ${recommendation.section.Section_Name} (${recommendation.section.Actual_Load}/${recommendation.section.Capacity})`}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="section_id" className="label mb-2">Storage Assignment</label>
            <select id="section_id" className="input" {...register('section_id')} style={{ borderColor: 'var(--gold-300)' }}>
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
            <label htmlFor="found_by_contact" className="label mb-2">Who brought it in?</label>
            <p className="text-xs mb-2" style={{ color: 'var(--rust-600)' }}>Name and contact of the person who found or turned in the item</p>
            <input id="found_by_contact" className="input" {...register('found_by_contact', { required: 'Required — the finder\'s information is significant' })} placeholder="e.g., Juan Santos — 09171234567" aria-invalid={errors.found_by_contact ? 'true' : undefined} aria-describedby={errors.found_by_contact ? 'found_by_contact-error' : undefined} style={{ borderColor: errors.found_by_contact ? 'var(--status-terracotta)' : 'var(--gold-300)' }} />
            {errors.found_by_contact && <p id="found_by_contact-error" role="alert" className="text-xs mt-1" style={{ color: 'var(--status-terracotta)' }}>{errors.found_by_contact.message}</p>}
          </div>

          {/* Description */}
          <div className="col-span-2">
            <label htmlFor="item_description" className="label mb-2">What do you know about it?</label>
            <p className="text-xs mb-2" style={{ color: 'var(--rust-600)' }}>Include condition, brand, any unique details or contents you saw</p>
            <textarea id="item_description" className="input" rows={3} {...register('item_description', { required: 'Required' })} placeholder="e.g., Good condition, smells new, has an ID inside..." aria-invalid={errors.item_description ? 'true' : undefined} aria-describedby={errors.item_description ? 'item_description-error' : undefined} style={{ borderColor: errors.item_description ? 'var(--status-terracotta)' : 'var(--gold-300)' }} />
            {errors.item_description && <p id="item_description-error" role="alert" className="text-xs mt-1" style={{ color: 'var(--status-terracotta)' }}>{errors.item_description.message}</p>}
          </div>

          {/* Photo */}
          <div className="col-span-2">
            <label className="label mb-2">Photo <span style={{ color: '#9CA3AF' }}>(Optional)</span></label>
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
        <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Registering...' : 'Register Item'}</button>
      </div>
    </form>
  );
}
