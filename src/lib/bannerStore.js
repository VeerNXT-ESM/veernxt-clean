import { useEffect, useState } from 'react';
import { supabase } from './supabase';

/**
 * CMS-managed banners for the signed-in pages.
 *
 * BANNER_SLOTS is the single list of banner slots: where each one appears, the
 * size uploads are cropped to, which text fields the admin can edit, and the
 * built-in default image/text. The site_banners table (sql/site_banners.sql)
 * only stores overrides -- an empty column falls back to the default here, so
 * with no rows every page looks exactly as it did before.
 *
 * Rows are fetched once per page load and shared through useBanner(). The last
 * fetched rows are also kept in localStorage so a returning visitor sees the
 * custom banner immediately instead of the default flashing first.
 */

export const BANNER_TEXT_FIELDS = {
  eyebrow: 'Eyebrow (small label)',
  title: 'Title',
  title_highlight: 'Title highlight (accent colour)',
  subtitle: 'Tagline',
  description: 'Description',
  cta_label: 'Button text',
};

// Public address of the R2 bucket that holds the site's built-in banner media (site/landing/...).
// Change this one constant if the bucket's public domain ever changes.
const SITE_MEDIA_BASE = 'https://pub-8c123d43246448199bbe4a14bffa2c06.r2.dev';

export const BANNER_SLOTS = [
  {
    key: 'lc.hero',
    page: 'Learning Center',
    path: '/learning-center',
    label: 'Top hero banner',
    width: 1920,
    height: 640,
    defaults: {
      image: '/hero/hero_image.jpg',
      title: 'Your Learning Center',
      subtitle: 'Prepare. Learn. Grow. Serve Beyond.',
      description: 'Find exams, study material and skills training tailored to your profile.',
    },
  },
  {
    key: 'lc.promo',
    page: 'Learning Center',
    path: '/learning-center',
    label: 'Career promo banner (bottom of Recommended view)',
    width: 1920,
    height: 640,
    defaults: {
      image: '/hero/hero_image.jpg',
      eyebrow: 'VeerNXT Career Transition',
      title: 'Discipline built you.',
      title_highlight: 'Learning takes you further.',
      description:
        'Access structured courses, practice tests and expert content to achieve your next career goal. Built specifically for armed forces personnel transitioning into civilian leadership and public service.',
      cta_label: 'Explore All Courses',
    },
  },
  {
    key: 'lc.state_directory',
    page: 'Learning Center',
    path: '/learning-center',
    label: 'State / UT directory banner (image only)',
    width: 1920,
    height: 560,
    defaults: { image: '/category_banners/state_psc.jpg' },
  },
  {
    key: 'dashboard.welcome',
    page: 'Dashboard',
    path: '/dashboard',
    label: 'Welcome banner behind the profile card (image only)',
    width: 1920,
    height: 560,
    defaults: { image: '/veernxt_assets/banners/B14_next_chapter.png' },
  },
  {
    key: 'dashboard.learning_promo',
    page: 'Dashboard',
    path: '/dashboard',
    label: 'Learning Center promo card (right rail)',
    width: 800,
    height: 600,
    defaults: {
      image: '/veernxt_assets/banners/B08_learning_path.png',
      title: 'Keep Learning.',
      title_highlight: 'Keep Moving Forward.',
      subtitle: 'Every small step builds a bigger future.',
      cta_label: 'Explore Learning Center',
    },
  },
  {
    key: 'jobs.hero',
    page: 'Jobs',
    path: '/jobs',
    label: 'Job board hero banner',
    width: 1920,
    height: 560,
    defaults: {
      image: '/veernxt_assets/banners/B13_next_mission.png',
      eyebrow: 'Careers for Veterans',
      title: 'Discover Your Next Mission',
      description: 'Explore government, PSU and veteran-friendly opportunities that value your service, skills and leadership.',
    },
  },
  {
    key: 'network.hero',
    page: 'Network',
    path: '/network',
    label: 'Network hero banner',
    width: 1920,
    height: 560,
    defaults: {
      image: '/veernxt_assets/banners/B12_my_network.png',
      eyebrow: 'Network',
      title: 'Connect. Collaborate.',
      title_highlight: 'Grow Together.',
      description: 'Build meaningful professional relationships with fellow veterans, government professionals and industry partners.',
    },
  },
  // ── Landing page (public home page, shown to signed-out visitors) ──────────────
  // Image-only slots (plus video slots). Defaults are the files on R2 (site/landing/); an uploaded
  // image or pasted video URL in Admin -> Banners overrides them.
  {
    key: 'landing.hero',
    page: 'Landing page',
    path: '/',
    label: 'Hero background video (poster image + MP4 URL)',
    kind: 'video',
    width: 1920,
    height: 1080,
    defaults: { image: `${SITE_MEDIA_BASE}/site/landing/hero_image.ee9a1a57.webp`, video: `${SITE_MEDIA_BASE}/site/landing/hero_video1.39a0210f.mp4` },
  },
  // The six "What is VeerNXT?" YouTube videos live in the site_videos table (Admin -> Videos, src/lib/videoStore.js).
  ...[
    ['services_1', 'Service card 1', 1448, 1086, `${SITE_MEDIA_BASE}/site/landing/F3A.afa74d3e.webp`],
    ['services_2', 'Service card 2', 1448, 1086, `${SITE_MEDIA_BASE}/site/landing/F3_B.57cfe188.webp`],
    ['step_1', 'Onboarding step 1', 1402, 1122, `${SITE_MEDIA_BASE}/site/landing/F4_A.29638149.webp`],
    ['step_2', 'Onboarding step 2', 1402, 1122, `${SITE_MEDIA_BASE}/site/landing/F4B.e9cb36af.webp`],
    ['step_3', 'Onboarding step 3', 1402, 1122, `${SITE_MEDIA_BASE}/site/landing/F4C.43707928.webp`],
    ['step_4', 'Onboarding step 4', 1402, 1122, `${SITE_MEDIA_BASE}/site/landing/F4D.587bdcf2.webp`],
    ['compliance_1', 'Regulatory compliance card 1', 1254, 1254, `${SITE_MEDIA_BASE}/site/landing/F5A.7419a303.webp`],
    ['compliance_2', 'Regulatory compliance card 2', 1254, 1254, `${SITE_MEDIA_BASE}/site/landing/F5B.092ac81d.webp`],
    ['compliance_3', 'Regulatory compliance card 3', 1254, 1254, `${SITE_MEDIA_BASE}/site/landing/F5C.22dcf869.webp`],
    ['employer', 'Employer portal screenshot', 1672, 941, `${SITE_MEDIA_BASE}/site/landing/emplyer-portal.1ca79f46.webp`],
    ['app_phone', 'App preview (phone mockup)', 1086, 1448, `${SITE_MEDIA_BASE}/site/landing/F6_Phone.d1f21433.webp`],
  ].map(([k, label, width, height, image]) => ({
    key: `landing.${k}`,
    page: 'Landing page',
    path: '/',
    label: `${label} (image only)`,
    width,
    height,
    defaults: { image },
  })),
];

export const BANNER_SLOT_MAP = Object.fromEntries(BANNER_SLOTS.map((s) => [s.key, s]));

/** Text fields a slot exposes = the ones it has a default for. */
export const slotTextFields = (slot) => Object.keys(BANNER_TEXT_FIELDS).filter((f) => slot.defaults[f] !== undefined);

const STORAGE_KEY = 'site_banners_cache_v1';

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStored(rows) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch {
    // storage unavailable (private mode, quota) -- the network copy still works
  }
}

let cache = readStored(); // { [key]: row }
let fresh = false;
let inflight = null;
const listeners = new Set();

async function load() {
  const { data, error } = await supabase.from('site_banners').select('*');
  if (error) throw error;
  return Object.fromEntries((data || []).map((r) => [r.key, r]));
}

function ensureLoaded() {
  if (fresh || inflight) return;
  inflight = load()
    .then((rows) => {
      writeStored(rows);
      return rows;
    })
    // A failed fetch (table not created yet, offline) keeps whatever we had -- defaults at worst.
    .catch(() => cache || {})
    .then((rows) => {
      cache = rows;
      fresh = true;
      inflight = null;
      listeners.forEach((fn) => fn(rows));
    });
}

export function refreshBanners() {
  fresh = false;
  inflight = null;
  ensureLoaded();
}

const filled = (v) => typeof v === 'string' && v.trim() !== '';

/** Merges a slot's stored overrides over its defaults. */
export function resolveBanner(key, rows) {
  const slot = BANNER_SLOT_MAP[key];
  if (!slot) throw new Error(`Unknown banner slot: ${key}`);
  const row = rows?.[key] || {};
  const out = { key, customImage: filled(row.image_url), image: filled(row.image_url) ? row.image_url : slot.defaults.image };
  if (slot.defaults.video !== undefined) {
    out.customVideo = filled(row.video_url);
    out.video = out.customVideo ? row.video_url.trim() : slot.defaults.video;
  }
  for (const f of Object.keys(BANNER_TEXT_FIELDS)) {
    if (slot.defaults[f] !== undefined) out[f] = filled(row[f]) ? row[f] : slot.defaults[f];
  }
  return out;
}

/** CSS url() value that survives quotes/brackets in the URL. */
export const cssUrl = (url) => `url("${String(url).replace(/["\\\n]/g, encodeURIComponent)}")`;

/**
 * Inline style that sets a CSS custom property to the banner image -- only when
 * a custom image is uploaded, so the stylesheet's own url() stays the fallback.
 */
export const bannerImageStyle = (banner, cssVar, extra = {}) =>
  banner.customImage ? { [cssVar]: cssUrl(banner.image), ...extra } : undefined;

export function useBanner(key) {
  const [rows, setRows] = useState(cache);
  useEffect(() => {
    listeners.add(setRows);
    if (fresh) setRows(cache);
    else ensureLoaded();
    return () => {
      listeners.delete(setRows);
    };
  }, []);
  return resolveBanner(key, rows);
}

/** Same as useBanner, for several slots at once: returns { [key]: resolvedBanner }. */
export function useBanners(keys) {
  const [rows, setRows] = useState(cache);
  useEffect(() => {
    listeners.add(setRows);
    if (fresh) setRows(cache);
    else ensureLoaded();
    return () => {
      listeners.delete(setRows);
    };
  }, []);
  return Object.fromEntries(keys.map((k) => [k, resolveBanner(k, rows)]));
}

/**
 * Accepts a YouTube link (watch, youtu.be, embed, shorts) or a bare 11-character id and
 * returns the id, or null when it is not recognisable.
 */
export function parseYouTubeId(input) {
  const v = String(input || '').trim();
  if (/^[\w-]{11}$/.test(v)) return v;
  const m = v.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i);
  return m ? m[1] : null;
}

/** All rows, for the admin page. */
export function useBannerRows() {
  const [rows, setRows] = useState(cache);
  useEffect(() => {
    listeners.add(setRows);
    refreshBanners();
    return () => {
      listeners.delete(setRows);
    };
  }, []);
  return { rows: rows || {}, ready: fresh };
}
