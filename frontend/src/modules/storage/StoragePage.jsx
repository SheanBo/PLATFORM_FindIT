import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { PageHead, Surface, SectionLabel, Badge, StatusBadge } from '../../components/ui/kit';
import { Lock, ShieldCheck, CircleCheck, Ban, Wand2, ArrowRight, AlertTriangle } from 'lucide-react';

// Small, high-value categories are secured in the office safe; everyday items go in lockers.
const VALUABLES = ['Wallet', 'Phone', 'Laptop', 'Tablet', 'Jewelry', 'ID_Card', 'Documents', 'Eyewear'];
const typeFor = (cat) => (VALUABLES.includes(cat) ? 'Office_Safe' : 'Locker');
const reasonFor = (cat) =>
  VALUABLES.includes(cat) ? 'High-value items are secured in the office safe.' : 'Everyday items are stored in a locker.';
const freeOf = (s) => (s.Capacity || 0) - (s.Actual_Load ?? s.Current_Load ?? 0);
const isFull = (s) => freeOf(s) <= 0;
const typeLabel = (t) => (t === 'Office_Safe' ? 'Office safe' : 'Locker');

export default function StoragePage() {
  const [sections, setSections] = useState([]);
  const [expired, setExpired] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState(null);
  const [sectionDetail, setSectionDetail] = useState(null);
  const [showExpired, setShowExpired] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/findit-storage'),
      api.get('/findit-storage/expired/items'),
      api.get('/findit-dashboard/categories'),
    ])
      .then(([s, e, c]) => {
        setSections(s.data.data);
        setExpired(e.data.data);
        setCategories(c.data.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const loadSection = (id) => {
    api.get(`/findit-storage/${id}`).then((r) => { setSectionDetail(r.data); setSelectedSection(id); });
  };

  // Smart placement recommendation for the chosen category.
  const recommend = (cat) => {
    if (!cat) return null;
    const type = typeFor(cat);
    const preferred = sections.filter((s) => s.Storage_Type === type && freeOf(s) > 0).sort((a, b) => freeOf(b) - freeOf(a));
    if (preferred.length) return { section: preferred[0], type, overflow: false };
    const any = sections.filter((s) => freeOf(s) > 0).sort((a, b) => freeOf(b) - freeOf(a));
    return { section: any[0] || null, type, overflow: any.length > 0 };
  };
  const rec = recommend(category);

  const groups = [
    { label: 'Office safes', type: 'Office_Safe' },
    { label: 'Lockers', type: 'Locker' },
  ].map((g) => ({
    ...g,
    rows: sections.filter((s) => s.Storage_Type === g.type).sort((a, b) => (freeOf(b) > 0) - (freeOf(a) > 0)),
  }));

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-8">
        <PageHead
          title="Storage"
          subtitle="Availability and smart placement of found items"
          actions={expired.length > 0 && (
            <button onClick={() => setShowExpired(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: 'rgba(210,105,30,0.12)', color: 'var(--status-terracotta)' }}>
              <AlertTriangle className="w-4 h-4" /> {expired.length} expired
            </button>
          )}
        />

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="h-20 rounded-xl skeleton" />)}</div>
        ) : (
          <>
            {/* Smart placement */}
            <Surface className="p-5 mb-8">
              <div className="flex items-center gap-2 mb-1">
                <Wand2 className="w-4 h-4 text-gold-500" aria-hidden="true" />
                <h3 className="text-navy-900 font-semibold">Smart placement</h3>
              </div>
              <p className="text-sm text-rust-600 mb-4">Choose a found-item category to see the recommended section.</p>

              <div className="flex flex-wrap gap-2 mb-5">
                {categories.map((c) => {
                  const name = c.Category_Name;
                  const active = name === category;
                  return (
                    <button
                      key={c.Category_ID}
                      onClick={() => setCategory(active ? '' : name)}
                      className="px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors"
                      style={active
                        ? { backgroundColor: 'var(--navy-900)', color: '#fff' }
                        : { border: '1px solid var(--gold-300)', color: 'var(--navy-900)', backgroundColor: '#fff' }}
                    >
                      {name.replace(/_/g, ' ')}
                    </button>
                  );
                })}
              </div>

              {rec && (
                <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(212,162,78,0.10)', border: '1px solid var(--gold-300)' }}>
                  {rec.section ? (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-2 flex-wrap text-sm">
                        <span className="font-semibold text-navy-900">{category.replace(/_/g, ' ')}</span>
                        <ArrowRight className="w-4 h-4 text-rust-600" aria-hidden="true" />
                        <span className="font-semibold text-navy-900">{rec.section.Section_Name}</span>
                        <Badge tone="success"><CircleCheck className="w-3.5 h-3.5" /> Has vacancy</Badge>
                      </div>
                      <p className="text-sm text-rust-600 sm:ml-2">
                        {reasonFor(category)}
                        {rec.overflow && ` No ${typeLabel(rec.type).toLowerCase()} has space — nearest option chosen.`}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm font-medium" style={{ color: 'var(--status-terracotta)' }}>
                      Every section is full — free up space before registering new items.
                    </p>
                  )}
                </div>
              )}
            </Surface>

            {/* Sections */}
            <div className="space-y-8">
              {groups.map((g) => (
                <section key={g.type}>
                  <div className="flex items-center gap-2 mb-3">
                    <SectionLabel>{g.label}</SectionLabel>
                    {rec && rec.type === g.type && <span className="text-[11px] font-semibold text-gold-500">· suggested for {category.replace(/_/g, ' ')}</span>}
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {g.rows.map((s) => {
                      const full = isFull(s);
                      const Icon = s.Storage_Type === 'Locker' ? Lock : ShieldCheck;
                      const recommended = rec && rec.section && rec.section.Section_ID === s.Section_ID;
                      return (
                        <Surface
                          key={s.Section_ID}
                          onClick={() => loadSection(s.Section_ID)}
                          className="p-5 flex items-center justify-between gap-3 cursor-pointer transition-shadow hover:shadow-md"
                          style={recommended ? { boxShadow: '0 0 0 2px var(--gold-500)' } : undefined}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(212,162,78,0.14)' }}>
                              <Icon className="w-4 h-4 text-gold-500" />
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-navy-900 truncate">{s.Section_Name}</p>
                              {recommended && <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-gold-500">Recommended</p>}
                            </div>
                          </div>
                          {full
                            ? <Badge tone="danger"><Ban className="w-3.5 h-3.5" /> Full</Badge>
                            : <Badge tone="success"><CircleCheck className="w-3.5 h-3.5" /> Has vacancy</Badge>}
                        </Surface>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Section detail */}
      <Modal isOpen={!!selectedSection} onClose={() => setSelectedSection(null)} title={sectionDetail?.Section_Name || 'Section'} size="lg">
        {sectionDetail && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <StatusBadge status={sectionDetail.Storage_Type === 'Office_Safe' ? 'Office safe' : 'Locker'} />
              {(sectionDetail.item_count >= sectionDetail.Capacity)
                ? <Badge tone="danger"><Ban className="w-3.5 h-3.5" /> Full</Badge>
                : <Badge tone="success"><CircleCheck className="w-3.5 h-3.5" /> Has vacancy</Badge>}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[520px]">
                <thead>
                  <tr style={{ backgroundColor: 'rgba(212,162,78,0.08)', borderBottom: '1px solid var(--gold-300)' }}>
                    {['Item', 'Category', 'Days stored', 'Status'].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-rust-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(!sectionDetail.items || sectionDetail.items.length === 0) && (
                    <tr><td colSpan={4} className="text-center py-6 text-rust-600">No items stored</td></tr>
                  )}
                  {sectionDetail.items?.map((item, i) => (
                    <tr key={item.Item_ID} style={{ borderTop: i === 0 ? 'none' : '1px solid rgba(212,162,78,0.18)' }}>
                      <td className="px-4 py-2.5">
                        <p className="font-semibold text-navy-900">{item.Item_Name}</p>
                        <p className="text-xs text-rust-600">{item.Item_Color}{item.Item_Brand ? ` · ${item.Item_Brand}` : ''}</p>
                      </td>
                      <td className="px-4 py-2.5 text-rust-600">{item.Category_Name?.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-2.5">
                        <span style={{ color: item.Days_Stored > 30 ? 'var(--status-terracotta)' : 'var(--rust-600)', fontWeight: item.Days_Stored > 30 ? 600 : 400 }}>{item.Days_Stored}d</span>
                      </td>
                      <td className="px-4 py-2.5"><StatusBadge status={item.Item_Status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* Expired items */}
      <Modal isOpen={showExpired} onClose={() => setShowExpired(false)} title={`Expired items (${expired.length})`} size="lg">
        <div className="space-y-3">
          <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: 'rgba(210,105,30,0.08)', border: '1px solid var(--status-terracotta)', color: 'var(--status-terracotta)' }}>
            These items have been stored for more than 30 days without being claimed.
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr style={{ backgroundColor: 'rgba(212,162,78,0.08)', borderBottom: '1px solid var(--gold-300)' }}>
                  {['Item', 'Category', 'Days', 'Location'].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-rust-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expired.map((e, i) => (
                  <tr key={e.Item_ID} style={{ borderTop: i === 0 ? 'none' : '1px solid rgba(212,162,78,0.18)' }}>
                    <td className="px-4 py-2.5"><p className="font-semibold text-navy-900">{e.Item_Name}</p><p className="text-xs text-rust-600">{e.Item_Color}</p></td>
                    <td className="px-4 py-2.5 text-rust-600">{e.Category_Name?.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-2.5 font-semibold" style={{ color: 'var(--status-terracotta)' }}>{e.Days_Unclaimed}d</td>
                    <td className="px-4 py-2.5 text-rust-600">{e.Storage_Location || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
}
