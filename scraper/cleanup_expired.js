// Removes expired and duplicate jobs from the jobs table (default jobs_v2).
//
//   node cleanup_expired.js              dry run: shows what WOULD be removed, changes nothing
//   node cleanup_expired.js --execute    backs the rows up to ./backups/, then deletes them
//   node cleanup_expired.js --execute --keep-duplicates   only expired jobs, leave duplicates alone
//
// Expired  = last_date is set and is before now. Jobs with no last_date are never removed (their
//            deadline is unknown).
// Duplicate = two rows with the same title after lower-casing and dropping punctuation. The row with
//            the lowest job_id is kept. Placeholder titles ("Get Details", "Read more") are ignored,
//            since those are different jobs with a bad title, not copies.
//
// Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env (same as the scraper). It writes with the
// service-role key, so run the dry run first and read it.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const TABLE = process.env.JOBS_TABLE || 'jobs_v2';
const EXECUTE = process.argv.includes('--execute');
const KEEP_DUPLICATES = process.argv.includes('--keep-duplicates');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env first.');
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const norm = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const isPlaceholderTitle = (t) => {
  const n = norm(t);
  return n.length < 8 || /^(get details|read more|click here|view details|apply now|notification)$/.test(n);
};

async function fetchAll() {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(TABLE).select('*').order('job_id').range(from, from + 999);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return rows;
}

(async () => {
  const rows = await fetchAll();
  const now = new Date();

  const expired = rows.filter((r) => r.last_date && new Date(r.last_date) < now);
  const expiredIds = new Set(expired.map((r) => r.job_id));

  const groups = new Map();
  rows.forEach((r) => {
    if (isPlaceholderTitle(r.title)) return;
    const k = norm(r.title);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  });
  const duplicates = [];
  if (!KEEP_DUPLICATES) {
    groups.forEach((g) => {
      if (g.length > 1) g.slice(1).forEach((r) => { if (!expiredIds.has(r.job_id)) duplicates.push(r); });
    });
  }

  const noDeadline = rows.filter((r) => !r.last_date).length;
  console.log(`${TABLE}: ${rows.length} rows | no deadline recorded (never removed): ${noDeadline}`);
  console.log(`expired (deadline before ${now.toISOString().slice(0, 10)}): ${expired.length}`);
  console.log(`duplicates (later copy of the same title): ${duplicates.length}${KEEP_DUPLICATES ? ' (skipped, --keep-duplicates)' : ''}`);
  duplicates.forEach((r) => console.log(`   duplicate id ${r.job_id}: ${String(r.title).slice(0, 70)}`));

  const doomed = [...expired, ...duplicates];
  if (!doomed.length) { console.log('Nothing to remove.'); return; }
  if (!EXECUTE) {
    console.log(`\nDRY RUN: ${doomed.length} row(s) would be removed. Run again with --execute to do it.`);
    return;
  }

  const dir = path.join(__dirname, 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${TABLE}_removed_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(file, JSON.stringify(doomed));
  console.log(`\nBacked up ${doomed.length} row(s) to ${file}`);

  let removed = 0;
  const ids = doomed.map((r) => r.job_id);
  for (let i = 0; i < ids.length; i += 100) {
    const batch = ids.slice(i, i + 100);
    const { error, count } = await supabase.from(TABLE).delete({ count: 'exact' }).in('job_id', batch);
    if (error) { console.error('Delete failed:', error.message, '(rows removed so far:', removed + ')'); process.exit(1); }
    removed += count || 0;
  }
  console.log(`Removed ${removed} row(s). To restore, re-insert the rows from the backup file.`);
})().catch((e) => { console.error(e.message); process.exit(1); });
