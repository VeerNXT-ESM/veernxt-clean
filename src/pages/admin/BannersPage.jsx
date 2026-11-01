import { useEffect, useState } from 'react';
import { ExternalLink, RotateCcw, Save, CheckCircle2, XCircle, RefreshCw, Image as ImageIcon, Trash2 } from 'lucide-react';
import { adminFrom } from '../../lib/adminDb';
import {
  BANNER_SLOTS, BANNER_TEXT_FIELDS, slotTextFields, resolveBanner, refreshBanners, useBannerRows, parseYouTubeId,
} from '../../lib/bannerStore';
import ThumbnailCell from './ThumbnailCell';

/**
 * Admin -> Banners. One card per banner slot on the signed-in pages
 * (slot list + defaults: src/lib/bannerStore.js). Uploads are cropped to the
 * slot's size and stored on R2; image URL and text overrides are saved to
 * site_banners. An empty field means "use the built-in default", so Reset just
 * clears the override.
 *
 * Slots with kind 'video' (poster image + MP4 URL) or 'youtube' (a YouTube link or id) also
 * store site_banners.video_url (sql/site_banners_video.sql).
 */

const adminEmail = () => {
  try {
    return JSON.parse(localStorage.getItem('admin_session') || '{}').email || null;
  } catch {
    return null;
  }
};

async function saveBanner(key, values) {
  const { error } = await adminFrom('site_banners').upsert(
    { key, ...values, updated_at: new Date().toISOString(), updated_by: adminEmail() },
    { onConflict: 'key' },
  );
  if (error) throw new Error(error.message || 'Save failed');
  refreshBanners();
}

const Badge = ({ custom }) => (
  <span
    style={{
      fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
      padding: '0.15rem 0.5rem', borderRadius: '2px',
      background: custom ? 'rgba(16, 185, 129, 0.14)' : 'rgba(100, 116, 139, 0.14)',
      color: custom ? '#059669' : 'var(--admin-text-muted, #64748b)',
    }}
  >
    {custom ? 'Custom' : 'Default'}
  </span>
);

function BannerCard({ slot, row }) {
  const fields = slotTextFields(slot);
  const resolved = resolveBanner(slot.key, { [slot.key]: row });
  const emptyText = Object.fromEntries(fields.map((f) => [f, '']));
  const [text, setText] = useState(emptyText);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null); // { ok, msg }
  const isYoutube = slot.kind === 'youtube';
  const hasVideo = isYoutube || slot.kind === 'video';
  const [video, setVideo] = useState('');

  // Load the saved overrides into the form whenever the stored row changes.
  useEffect(() => {
    setText(Object.fromEntries(fields.map((f) => [f, row?.[f] || ''])));
    setVideo(row?.video_url || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row]);

  const hasCustomText = fields.some((f) => (row?.[f] || '').trim() !== '');
  const dirty = fields.some((f) => (text[f] || '') !== (row?.[f] || ''));

  const run = async (fn, okMsg) => {
    setBusy(true);
    setStatus(null);
    try {
      await fn();
      setStatus({ ok: true, msg: okMsg });
    } catch (err) {
      setStatus({ ok: false, msg: err.message });
    } finally {
      setBusy(false);
      setTimeout(() => setStatus(null), 6000);
    }
  };

  const saveText = () =>
    run(
      () => saveBanner(slot.key, Object.fromEntries(fields.map((f) => [f, text[f].trim() || null]))),
      'Text saved',
    );
  const resetText = () =>
    run(() => saveBanner(slot.key, Object.fromEntries(fields.map((f) => [f, null]))), 'Text reset to default');
  const saveVideo = () =>
    run(async () => {
      const v = video.trim();
      if (isYoutube) {
        const id = parseYouTubeId(v);
        if (!id) throw new Error('Not a YouTube link or id. Paste a watch / youtu.be / embed link or the 11-character id.');
        await saveBanner(slot.key, { video_url: id });
        setVideo(id);
      } else {
        if (!/^https:\/\/\S+\.(mp4|webm)(\?\S*)?$/i.test(v)) throw new Error('Enter the full https:// URL of an .mp4 or .webm file (for example on R2).');
        await saveBanner(slot.key, { video_url: v });
      }
    }, 'Video saved');
  const resetVideo = () => run(() => saveBanner(slot.key, { video_url: null }), 'Video reset to default');
  const resetImage = () => {
    if (!window.confirm('Delete the uploaded banner image? The original banner will be shown again.')) return;
    return run(() => saveBanner(slot.key, { image_url: null }), 'Uploaded banner deleted — original banner restored');
  };

  return (
    <div className="bn-card">
      <span className="bn-pill"><ImageIcon size={12} /> {slot.page}</span>

      <div className="bn-head">
        <div className="bn-head-text">
          <h3 className="bn-title">{slot.label}</h3>
          <a href={slot.path} target="_blank" rel="noreferrer" className="bn-sub">
            Used on {slot.path} <ExternalLink size={11} />
          </a>
          <div className="bn-badges">
            <Badge custom={resolved.customImage || resolved.customVideo} />
            {resolved.customImage && (
              <button type="button" className="bn-delete-btn" onClick={resetImage} disabled={busy} title="Delete the uploaded banner and go back to the original">
                <Trash2 size={12} /> Delete uploaded banner
              </button>
            )}
          </div>
        </div>
        {!isYoutube && (
          <div className="bn-image">
            <ThumbnailCell
              url={resolved.image}
              name={slot.key}
              keyPrefix="site-banners"
              width={slot.width}
              height={slot.height}
              previewWidth={170}
              enablePreview
              onSave={(url) => saveBanner(slot.key, { image_url: url })}
            />
            <span className="bn-image-hint">Image ({slot.width}×{slot.height})<br />Supports JPG, PNG, WebP</span>
          </div>
        )}
      </div>

      {hasVideo && (
        <div className="bn-fields">
          <div className="lc-input-group bn-long">
            <label htmlFor={`${slot.key}-video`}>{isYoutube ? 'YouTube link or video id' : 'Video file URL (.mp4 / .webm)'}</label>
            <input
              id={`${slot.key}-video`}
              type="text"
              value={video}
              placeholder={slot.defaults.video}
              maxLength={300}
              onChange={(e) => setVideo(e.target.value)}
            />
          </div>
          <div className="bn-foot" style={{ gridColumn: '1 / -1' }}>
            <button type="button" className="lc-btn primary" onClick={saveVideo} disabled={busy || video.trim() === (row?.video_url || '')}>
              {busy ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />} Save video
            </button>
            {resolved.customVideo && (
              <button type="button" className="lc-btn" onClick={resetVideo} disabled={busy}>
                <RotateCcw size={13} /> Reset video
              </button>
            )}
          </div>
        </div>
      )}

      {fields.length > 0 && (
        <div className="bn-fields">
          {fields.map((f) => {
            const long = f === 'description';
            return (
              <div key={f} className={`lc-input-group ${long ? 'bn-long' : ''}`}>
                <label htmlFor={`${slot.key}-${f}`}>{BANNER_TEXT_FIELDS[f]}</label>
                {long ? (
                  <textarea
                    id={`${slot.key}-${f}`}
                    rows={3}
                    value={text[f]}
                    placeholder={slot.defaults[f]}
                    maxLength={600}
                    onChange={(e) => setText((p) => ({ ...p, [f]: e.target.value }))}
                  />
                ) : (
                  <input
                    id={`${slot.key}-${f}`}
                    type="text"
                    value={text[f]}
                    placeholder={slot.defaults[f]}
                    maxLength={160}
                    onChange={(e) => setText((p) => ({ ...p, [f]: e.target.value }))}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="bn-foot">
        {fields.length > 0 && (
          <>
            <button type="button" className="lc-btn primary" onClick={saveText} disabled={busy || !dirty}>
              {busy ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />} Save Text
            </button>
            {hasCustomText && (
              <button type="button" className="lc-btn" onClick={resetText} disabled={busy}>
                <RotateCcw size={13} /> Reset text
              </button>
            )}
          </>
        )}
        {status && (
          <span className="bn-status" style={{ color: status.ok ? '#16a34a' : '#ef4444' }}>
            {status.ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />} {status.msg}
          </span>
        )}
        {row?.updated_at && (
          <span className="bn-updated">
            Last changed {new Date(row.updated_at).toLocaleString()}{row.updated_by ? ` by ${row.updated_by}` : ''}
          </span>
        )}
      </div>
    </div>
  );
}

// Tabs for the admin page. `pages` are the BANNER_SLOTS `page` values shown in each tab.
// Finance and Legal have no CMS-managed banners yet; their tabs say so.
const BANNER_TABS = [
  { key: 'marketing', label: 'Marketing page', pages: ['Landing page'] },
  { key: 'home', label: 'Home page', pages: ['Dashboard', 'Network'] },
  { key: 'learning', label: 'Learning Center', pages: ['Learning Center'] },
  { key: 'jobs', label: 'Jobs', pages: ['Jobs'] },
  { key: 'finance', label: 'Finance', pages: ['Finance'] },
  { key: 'legal', label: 'Legal', pages: ['Legal'] },
];
const TAB_STORAGE_KEY = 'admin.banners.tab';

const BannersPage = () => {
  const { rows, ready } = useBannerRows();
  const [tab, setTab] = useState(() => {
    try {
      const saved = localStorage.getItem(TAB_STORAGE_KEY);
      return BANNER_TABS.some((t) => t.key === saved) ? saved : BANNER_TABS[0].key;
    } catch { return BANNER_TABS[0].key; }
  });

  const pick = (key) => {
    setTab(key);
    try { localStorage.setItem(TAB_STORAGE_KEY, key); } catch { /* storage unavailable */ }
  };

  if (!ready) return <div className="lc-loading-state">Loading banners…</div>;

  const slotsFor = (t) => BANNER_SLOTS.filter((slot) => t.pages.includes(slot.page));
  const active = BANNER_TABS.find((t) => t.key === tab) || BANNER_TABS[0];
  const activeSlots = slotsFor(active);

  return (
    <>
      <div className="bn-tabs" role="tablist" aria-label="Banner pages">
        {BANNER_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            id={`bn-tab-${t.key}`}
            aria-selected={t.key === active.key}
            aria-controls="bn-tabpanel"
            className={`bn-tab ${t.key === active.key ? 'active' : ''}`}
            onClick={() => pick(t.key)}
          >
            {t.label}
            <span className="bn-tab-count">{slotsFor(t).length}</span>
          </button>
        ))}
      </div>

      <div id="bn-tabpanel" role="tabpanel" aria-labelledby={`bn-tab-${active.key}`}>
        {activeSlots.length === 0 ? (
          <div className="bn-empty">No banners on the {active.label} page are managed from the CMS yet.</div>
        ) : (
          <div className="bn-grid">
            {activeSlots.map((slot) => (
              <BannerCard key={slot.key} slot={slot} row={rows[slot.key]} />
            ))}
          </div>
        )}
      </div>
      <style>{`
        .bn-tabs { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 16px; border-bottom: 1px solid var(--admin-border, var(--c-line-2, #e2e8f0)); }
        .bn-tab { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; margin-bottom: -1px; cursor: pointer; font-size: 13.5px; font-weight: 700;
          color: var(--admin-text-muted, #64748b); background: none; border: 1px solid transparent; border-bottom: 2px solid transparent; }
        .bn-tab:hover { color: var(--admin-text, #0f172a); }
        .bn-tab.active { color: #047857; border-bottom-color: #059669; }
        .bn-tab:focus-visible { outline: 2px solid #059669; outline-offset: -2px; }
        .bn-tab-count { min-width: 20px; padding: 1px 6px; font-size: 11px; font-weight: 700; text-align: center; background: rgba(100,116,139,.14); color: var(--admin-text-muted, #64748b); }
        .bn-tab.active .bn-tab-count { background: rgba(16,185,129,.16); color: #047857; }
        .bn-empty { padding: 28px; text-align: center; font-size: 14px; color: var(--admin-text-muted, #64748b);
          background: var(--admin-surface, var(--c-bg-0, #fff)); border: 1px dashed var(--admin-border, var(--c-line-2, #e2e8f0)); }
        .bn-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; align-items: start; }
        .bn-card { display: flex; flex-direction: column; gap: 14px; min-width: 0; padding: 18px 20px; border-radius: 2px;
          background: var(--admin-surface, var(--c-bg-0, #fff)); border: 1px solid var(--admin-border, var(--c-line-2, #e2e8f0)); box-shadow: 0 1px 3px rgba(15,23,42,.05); }
        .bn-pill { align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 2px; font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
          background: rgba(16,185,129,.12); color: #047857; border: 1px solid rgba(16,185,129,.28); }
        .bn-head { display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap; }
        .bn-image-hint { display: none; }
        .bn-head-text { flex: 1 1 180px; min-width: 0; }
        .bn-title { margin: 0 0 4px; font-size: 15px; font-weight: 800; color: var(--admin-text, #0f172a); }
        .bn-sub { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--admin-text-muted, #64748b); text-decoration: none; overflow-wrap: anywhere; }
        .bn-badges { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
        .bn-delete-btn { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 2px; cursor: pointer; font-size: 11.5px; font-weight: 700; color: #dc2626; background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.3); }
        .bn-delete-btn:hover:not(:disabled) { background: rgba(239,68,68,.16); }
        .bn-delete-btn:disabled { opacity: .5; cursor: default; }
        .bn-link-btn { display: inline-flex; align-items: center; gap: 4px; background: none; border: none; cursor: pointer; font-size: 11.5px; font-weight: 600; color: var(--admin-text-muted, #64748b); padding: 0; }
        .bn-link-btn:hover { color: var(--ios-olive, #047857); }
        .bn-image { display: flex; align-items: center; gap: 12px; flex: 0 1 auto; min-width: 0; }
        .bn-image-hint { font-size: 11px; line-height: 1.4; color: var(--admin-text-muted, #64748b); }
        .bn-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 16px; padding-top: 14px; border-top: 1px solid var(--admin-border, var(--c-line-2, #e2e8f0)); }
        .bn-fields .lc-input-group { display: flex; flex-direction: column; gap: 6px; min-width: 0; margin: 0; }
        .bn-fields .lc-input-group label { font-size: 12px; font-weight: 700; letter-spacing: .02em; color: var(--admin-text, #334155); }
        .bn-fields .lc-input-group input, .bn-fields .lc-input-group textarea {
          width: 100%; box-sizing: border-box; min-height: 42px; padding: 10px 12px; border-radius: 2px; font: inherit; font-size: 13.5px;
          color: var(--admin-text, #0f172a); background: var(--admin-surface, #fff); border: 1px solid var(--admin-border, #cbd5e1);
          transition: border-color .15s, box-shadow .15s;
        }
        .bn-fields .lc-input-group textarea { resize: vertical; line-height: 1.5; min-height: 84px; }
        .bn-fields .lc-input-group input::placeholder, .bn-fields .lc-input-group textarea::placeholder { color: var(--admin-text-muted, #94a3b8); opacity: 1; }
        .bn-fields .lc-input-group input:hover, .bn-fields .lc-input-group textarea:hover { border-color: #94a3b8; }
        .bn-fields .lc-input-group input:focus, .bn-fields .lc-input-group textarea:focus { outline: none; border-color: #059669; box-shadow: 0 0 0 3px rgba(16,185,129,.18); }
        .bn-foot .lc-btn { min-height: 38px; padding: 0 16px; border-radius: 2px; font-weight: 700; }
        .bn-foot .lc-btn.primary:disabled { opacity: .55; }
        .bn-long { grid-column: 1 / -1; }
        .bn-foot { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .bn-status { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; }
        .bn-updated { font-size: 11px; color: var(--admin-text-muted, #64748b); margin-left: auto; }
        @media (max-width: 1100px) { .bn-grid { grid-template-columns: minmax(0, 1fr); } }
        @media (max-width: 600px) { .bn-fields { grid-template-columns: minmax(0, 1fr); } .bn-card { padding: 14px; } .bn-image { flex-wrap: wrap; } .bn-updated { margin-left: 0; } }
      `}</style>
    </>
  );
};

export default BannersPage;
