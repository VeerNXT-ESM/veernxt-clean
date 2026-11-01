-- Adds video support to the CMS banner slots (see src/lib/bannerStore.js, kind 'video' / 'youtube').
--
-- video_url holds, per slot key:
--   landing.hero          -> full https URL of the hero background .mp4/.webm
--   landing.video.<lang>  -> YouTube video id (the admin page normalises pasted links to the id)
-- NULL means "use the built-in default", same as the other columns. Safe to run more than once.

alter table public.site_banners add column if not exists video_url text;
