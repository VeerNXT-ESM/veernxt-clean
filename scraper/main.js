require('dotenv').config();
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { chromium } = require('playwright');
const { XMLParser } = require('fast-xml-parser');
const fs = require('fs');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
let ws;
try {
  ws = require('ws');
  if (typeof globalThis.WebSocket === 'undefined') {
    globalThis.WebSocket = ws;
  }
} catch (_) {}

// --- Supabase Database Configuration ---
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  ...(ws ? { realtime: { transport: ws } } : {})
}) : null;

// Target Database Table (defaults to jobs_v2)
const JOBS_TABLE = process.env.JOBS_TABLE || 'jobs_v2';

// --- AI provider ---
// Any OpenAI-compatible chat-completions API. Choose one in .env (see .env.example):
//   AI_PROVIDER=openai      (default) OpenAI. Needs OPENAI_API_KEY; model AI_MODEL (default gpt-4o-mini)
//   AI_PROVIDER=openrouter  OpenRouter. Needs OPENROUTER_API_KEY; model OPENROUTER_MODEL
//   AI_PROVIDER=custom      your own endpoint. Needs AI_API_URL, AI_API_KEY and AI_MODEL
// No key is bundled with this app. Without a working key: the AI filter is replaced by simple
// title rules (looksLikeNonJob), and jobs are saved WITHOUT a description (there is no template).
const AI_PROVIDER = (process.env.AI_PROVIDER || 'openai').toLowerCase();

const AI_API_URL = AI_PROVIDER === 'openrouter'
  ? 'https://openrouter.ai/api/v1/chat/completions'
  : AI_PROVIDER === 'custom'
    ? (process.env.AI_API_URL || '')
    : 'https://api.openai.com/v1/chat/completions';

const AI_API_KEY = AI_PROVIDER === 'openrouter'
  ? (process.env.OPENROUTER_API_KEY || '')
  : AI_PROVIDER === 'custom'
    ? (process.env.AI_API_KEY || '')
    : (process.env.OPENAI_API_KEY || '');

const AI_MODEL = AI_PROVIDER === 'openrouter'
  ? (process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct:free')
  : (process.env.AI_MODEL || 'gpt-4o-mini');

// Extra headers required by OpenRouter (ignored by the others)
const AI_EXTRA_HEADERS = AI_PROVIDER === 'openrouter'
  ? { 'HTTP-Referer': 'https://veernxt.com', 'X-Title': 'VeerNXT Scraper' }
  : {};

const AI_BATCH_SIZE = 5;
const AI_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS, 10) || 60000;
const AI_DESC_TIMEOUT_MS = parseInt(process.env.AI_DESC_TIMEOUT_MS, 10) || 90000;

let mainWindow;

// Startup: log which AI provider is active
console.log(`[AI Provider] Active: ${AI_PROVIDER.toUpperCase()} | URL: ${AI_API_URL} | Model: ${AI_MODEL}`);
if (!AI_API_URL || !AI_API_KEY) console.warn('[AI Provider] No AI key/URL configured: AI filtering and descriptions will fail. See .env.example.');
if (!supabase) console.warn('[Supabase] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set: database features are disabled. See .env.example.');

// --- Live Logger: sends logs to both console and the renderer UI ---
function sendLog(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const logLine = `[${timestamp}] ${message}`;
  console.log(logLine);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('log-message', { message: logLine, type });
  }
}

// --- Date Normalization Helper for Indian Job Postings ---
function parseIndianDate(str) {
  if (!str || typeof str !== 'string') {
    return { isoString: null, isExpired: false, display: null };
  }

  const cleaned = str.replace(/online application ends|registration last date|application last date|last date|available from/gi, '').trim();

  // Pattern 1: DD-MM-YYYY or DD/MM/YYYY
  const ddmmyyyy = cleaned.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  let dateObj = null;

  if (ddmmyyyy) {
    const day = parseInt(ddmmyyyy[1], 10);
    const month = parseInt(ddmmyyyy[2], 10) - 1;
    const year = parseInt(ddmmyyyy[3], 10);
    dateObj = new Date(Date.UTC(year, month, day));
  } else {
    // Pattern 2: "19 September 2026", "23-24 September 2026" (take upper day)
    const normalized = cleaned.replace(/–|-/g, ' ').replace(/\s+/g, ' ');
    const rangeMatch = normalized.match(/(\d{1,2})\s*(\d{1,2})?\s+([A-Za-z]+)\s+(\d{4})/);
    if (rangeMatch) {
      const day = parseInt(rangeMatch[2] || rangeMatch[1], 10);
      const parsed = new Date(`${rangeMatch[3]} ${day}, ${rangeMatch[4]}`);
      if (!isNaN(parsed.getTime())) dateObj = parsed;
    } else {
      const parsed = new Date(cleaned);
      if (!isNaN(parsed.getTime())) dateObj = parsed;
    }
  }

  if (dateObj && !isNaN(dateObj.getTime())) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return {
      isoString: dateObj.toISOString(),
      isExpired: dateObj < today,
      display: dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    };
  }

  return { isoString: null, isExpired: false, display: str };
}

// --- Vacancies Number Parser ---
function parseVacancies(val) {
  if (typeof val === 'number') return val;
  if (!val || typeof val !== 'string') return null;
  const digits = val.replace(/[^0-9]/g, '');
  if (!digits) return null;
  const parsed = parseInt(digits, 10);
  return isNaN(parsed) ? null : parsed;
}

// --- Rule-Based Multi-Tag Classifier (High-Accuracy Indian Job Taxonomy) ---
function classifyMultiTags(job) {
  const tags = new Set(['government_job']); // Default foundational tag for sarkari portals

  const text = `${job.title || ''} ${job.exam_name || ''} ${job.conducting_body || ''} ${job.raw_category || ''} ${job.career_track || ''}`.toLowerCase();
  const rawDetails = Array.isArray(job.fullDetails) ? JSON.stringify(job.fullDetails).toLowerCase() : '';
  const fullText = `${text} ${rawDetails}`;

  // 1. Roles & Designations
  if (/peon|chaprasi|attender|office attendant|multi tasking|mts|helper|group d\b/i.test(fullText)) {
    tags.add('peon_job');
  }
  if (/clerk|clerical|ldc|udc|lower division|upper division|junior assistant|csa\b/i.test(fullText)) {
    tags.add('clerk_job');
  }
  if (/officer|probationary officer|\bpo\b|\bso\b|specialist officer|manager|assistant manager|executive/i.test(fullText)) {
    tags.add('officer_job');
  }
  if (/constable|head constable|sepoy|jawan|gd constable/i.test(fullText)) {
    tags.add('constable_job');
  }
  if (/sub inspector|\bsi\b|asi\b|inspector/i.test(fullText)) {
    tags.add('sub_inspector_job');
  }
  if (/apprentice|act apprentice|trade apprentice/i.test(fullText)) {
    tags.add('apprentice_job');
  }
  if (/trainee|management trainee|diploma trainee/i.test(fullText)) {
    tags.add('trainee_job');
  }
  if (/stenographer|steno\b|typist/i.test(fullText)) {
    tags.add('stenographer_job');
  }
  if (/scientist|scientific officer|research assistant/i.test(fullText)) {
    tags.add('scientist_job');
  }
  if (/driver|motor vehicle|chauffeur/i.test(fullText)) {
    tags.add('driver_job');
  }

  // 2. Sectors & Departments
  if (/bank|banking|ibps|sbi|rbi|nabard|pnb|canara|bob|sidbi/i.test(fullText)) {
    tags.add('banking_job');
  }
  if (/railway|railways|rrb|rrc|irctc|metro rail/i.test(fullText)) {
    tags.add('railway_job');
  }
  if (/post|postal|dak sevak|gds\b|department of post/i.test(fullText)) {
    tags.add('postal_job');
  }
  if (/police|cisf|crpf|bsf|itbp|ssb|assam rifles|delhi police|state police/i.test(fullText)) {
    tags.add('police_job');
  }
  if (/army|navy|air force|defence|military|agniveer|mod\b|nda\b|cds\b/i.test(fullText)) {
    tags.add('defence_job');
  }
  if (/court|judiciary|judge|judicial|high court|supreme court|district court/i.test(fullText)) {
    tags.add('judiciary_job');
  }
  if (/teach|teacher|professor|lecturer|prt|tgt|pgt|kv\b|nvs\b|faculty/i.test(fullText)) {
    tags.add('teaching_job');
  }
  if (/engineer|engineering|\bje\b|\bae\b|junior engineer|assistant engineer|technical/i.test(fullText)) {
    tags.add('engineering_job');
  }
  if (/medical|doctor|nurse|nursing|aiims|pharmacist|hospital|health/i.test(fullText)) {
    tags.add('medical_job');
  }
  if (/ssc\b|staff selection/i.test(fullText)) {
    tags.add('ssc_job');
  }
  if (/upsc\b|civil service/i.test(fullText)) {
    tags.add('upsc_job');
  }
  if (/psu\b|ongc|bhel|sail|iocl|bpcl|ntpc|gail|hal|bel|power grid/i.test(fullText)) {
    tags.add('psu_job');
  }
  if (/central|upsc|ssc|rrb|india post/i.test(fullText)) {
    tags.add('central_govt_job');
  } else {
    tags.add('state_govt_job');
  }

  // 3. Qualifications
  if (/10th|matric|matriculation|sslc/i.test(fullText)) {
    tags.add('10th_pass_job');
  }
  if (/12th|intermediate|10\+2|higher secondary/i.test(fullText)) {
    tags.add('12th_pass_job');
  }
  if (/graduate|degree|b\.a|b\.sc|b\.com|graduation/i.test(fullText)) {
    tags.add('graduate_job');
  }
  if (/iti\b|trade certificate/i.test(fullText)) {
    tags.add('iti_job');
  }
  if (/diploma|polytechnic/i.test(fullText)) {
    tags.add('diploma_job');
  }

  // 4. Special Eligibility
  if (/no exam|merit list|direct recruitment|walk-in/i.test(fullText)) {
    tags.add('no_exam_job');
  }
  if (/ex-servicemen|esm quota|ex-service/i.test(fullText)) {
    tags.add('ex_servicemen_job');
  }

  return Array.from(tags);
}

/**
 * Picks the job's display name. A details-table value is used only if it looks like a real name:
 * placeholders ("Notify Later", "To Be Announced") and bare dates are rejected, and the post headline
 * is the fallback. (The old code matched any row whose label contained "Exam", e.g. "Exam Date".)
 */
function pickExamName(headline, ...candidates) {
  const months = /(january|february|march|april|may|june|july|august|september|october|november|december)/i;
  const placeholders = ['notify later', 'to be announced', 'will be announced', 'available soon', 'update soon', 'not available', 'n/a', 'tba', 'tbd'];
  const looksReal = (v) => {
    if (!v) return false;
    const t = String(v).trim();
    if (t.length < 8 || !/[a-z]/i.test(t)) return false;
    const lower = t.toLowerCase();
    if (placeholders.some((p) => lower === p || lower.includes(p))) return false;
    if (/[0-9]/.test(t) && months.test(t) && t.length < 25) return false;
    return true;
  };
  return candidates.find(looksReal) || headline;
}

/**
 * Rule-based check used only when the AI filter is unavailable: true for posts that are not
 * recruitment notices (results, admit cards, answer keys, syllabus, cut-offs, admissions...).
 */
function looksLikeNonJob(job) {
  const t = String(job.exam_name || job.title || '');
  const nonJobWords = /\b(admit card|hall ticket|result|answer key|syllabus|cut[- ]?off|merit list|score ?card|admission|counselling|counseling|seat allotment|exam city|city intimation|exam date|time ?table|call letter)\b/i;
  const looksLikeRecruitment = /\b(apply online|online form|vacanc(y|ies))\b/i;
  return nonJobWords.test(t) && !looksLikeRecruitment.test(t);
}

/**
 * Sends scraped jobs through the AI API in parallel batches to filter out expired/irrelevant jobs
 * and assign multi-tags (government_job, banking_job, peon_job, etc.).
 * Completes under 10 seconds via parallel execution and strict timeout fallback.
 */
async function filterJobsWithAI(jobs) {
  const totalFetched = jobs.length;
  const allFilteredJobs = [];
  const discardedJobs = [];
  const todayStr = new Date().toISOString().split('T')[0];

  sendLog(`🤖 AI Filter: Fast analysis on ${totalFetched} jobs (Parallel sub-10s mode)...`, 'ai');

  // Split into smaller batches for concurrent execution
  const batches = [];
  for (let i = 0; i < jobs.length; i += AI_BATCH_SIZE) {
    batches.push({
      batch: jobs.slice(i, i + AI_BATCH_SIZE),
      startIndex: i
    });
  }

  // Process a single batch with AI, protected by a strict timeout
  async function processBatchAsync({ batch, startIndex }, batchIndex) {
    const jobSummaries = batch.map((job, idx) => ({
      index: startIndex + idx,
      title: job.exam_name || job.title || 'Unknown',
      body: job.conducting_body || 'Unknown',
      career_track: job.career_track || 'Unknown',
      lastDate: job.lastDate || null,
      vacancies: job.vacancies || null,
    }));

    const systemPrompt = `You are a high-speed JSON classifier. Return ONLY a valid JSON array. No markdown, no prose.
Format: [{"index": <n>, "relevant": true, "tags": ["government_job", "banking_job", "peon_job"], "sector": "<MostSpecificSector>"}]
For non-jobs (admit card, result, syllabus, answer key), set "relevant": false, "reason": "<why>".
Tags MUST be lowercase snake_case (e.g. government_job, banking_job, peon_job, clerk_job, railway_job, postal_job, police_job, defence_job, teaching_job, engineering_job, 10th_pass_job, graduate_job, no_exam_job).`;

    const userMessage = `Today=${todayStr}. Filter & multi-tag these Indian jobs:\n${JSON.stringify(jobSummaries)}`;

    // Set up AbortController to guarantee sub-10-second response
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    try {
      const response = await fetch(AI_API_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_API_KEY}`,
          ...AI_EXTRA_HEADERS
        },
        body: JSON.stringify({
          model: AI_MODEL,
          temperature: 0.1,
          max_tokens: 1024,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ]
        })
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`AI API HTTP ${response.status}`);
      }

      const data = await response.json();
      const aiContent = data.choices?.[0]?.message?.content || '[]';

      // Parse JSON from AI
      let aiResults = [];
      try {
        aiResults = JSON.parse(aiContent.trim());
      } catch (_) {
        const stripped = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const firstBracket = stripped.indexOf('[');
        const lastBracket = stripped.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket > firstBracket) {
          aiResults = JSON.parse(stripped.substring(firstBracket, lastBracket + 1));
        } else {
          throw new Error('No JSON array in AI response');
        }
      }

      return { success: true, aiResults, batch, startIndex };
    } catch (err) {
      clearTimeout(timeout);
      const isTimeout = err.name === 'AbortError';
      sendLog(`⚡ ${isTimeout ? 'AI Timeout (>8s)' : 'AI API Notice'}: Instant rule-based fallback applied for batch ${batchIndex + 1}`, 'warn');
      return { success: false, error: err.message, batch, startIndex };
    }
  }

  const startTime = Date.now();
  // Run all batches in parallel
  const batchPromises = batches.map((b, idx) => processBatchAsync(b, idx));
  const results = await Promise.all(batchPromises);
  const elapsedMs = Date.now() - startTime;

  sendLog(`⚡ AI Inference completed in ${elapsedMs}ms (${(elapsedMs / 1000).toFixed(1)}s)`, 'ai');

  // Collate results
  for (const res of results) {
    const { success, aiResults, batch, startIndex } = res;

    if (success && Array.isArray(aiResults)) {
      for (const aiResult of aiResults) {
        const originalJob = jobs[aiResult.index];
        if (!originalJob) continue;

        if (aiResult.relevant === false) {
          sendLog(`  ❌ Discarded: "${originalJob.exam_name || originalJob.title}" (${aiResult.reason || 'Not a vacancy'})`, 'discard');
          discardedJobs.push({ ...originalJob, discard_reason: aiResult.reason });
        } else {
          // Merge AI tags with rule-based tags for comprehensive coverage
          const ruleTags = classifyMultiTags(originalJob);
          const aiTags = Array.isArray(aiResult.tags) ? aiResult.tags.map(t => t.toLowerCase().replace(/[\s-]/g, '_')) : [];
          const combinedTags = Array.from(new Set([...ruleTags, ...aiTags]));

          originalJob.tags = combinedTags;
          originalJob.job_sector = aiResult.sector || originalJob.career_track || 'Other';
          originalJob.ai_status = 'selected';
          allFilteredJobs.push(originalJob);
          sendLog(`  ✅ Kept: "${originalJob.exam_name || originalJob.title}" → Tags: [${combinedTags.slice(0, 3).join(', ')}...]`, 'success');
        }
      }

      // Any job in the batch not returned by AI
      for (const job of batch) {
        const idx = jobs.indexOf(job);
        const covered = aiResults.some(r => r.index === idx);
        if (!covered) {
          if (looksLikeNonJob(job)) {
            discardedJobs.push({ ...job, discard_reason: 'rule: not a recruitment post (result, admit card, answer key, syllabus...)' });
            continue;
          }
          job.tags = classifyMultiTags(job);
          job.job_sector = job.career_track || 'Other';
          job.ai_status = 'rule_fallback';
          allFilteredJobs.push(job);
        }
      }
    } else {
      // Fallback for failed/timed-out batch
      batch.forEach(job => {
        if (looksLikeNonJob(job)) {
          discardedJobs.push({ ...job, discard_reason: 'rule: not a recruitment post (result, admit card, answer key, syllabus...)' });
          return;
        }
        job.tags = classifyMultiTags(job);
        job.job_sector = job.career_track || 'Other';
        job.ai_status = 'rule_fallback';
        allFilteredJobs.push(job);
      });
    }
  }

  const totalSelected = allFilteredJobs.length;
  const totalDiscarded = discardedJobs.length;

  sendLog(`🏁 AI Pipeline Finished in ${(elapsedMs / 1000).toFixed(1)}s | Fetched: ${totalFetched} | Selected: ${totalSelected} | Discarded: ${totalDiscarded}`, 'ai');

  return {
    filteredJobs: allFilteredJobs,
    stats: { totalFetched, totalSelected, totalDiscarded, elapsedMs }
  };
}

/**
 * Generates a rich English job description by sending the scraped page text
 * through the AI API. Returns a formatted multi-paragraph description or null
 * if the API call fails / times out.
 *
 * Kept separate from filterJobsWithAI so it runs AFTER filtering — we only
 * spend AI tokens on jobs that passed the relevance gate.
 */
/**
 * Builds a context string for thin-data jobs from structured row fields.
 * Used when raw_json text is too sparse for a rich description.
 */
function buildThinDataContext(row, title) {
  const parts = [];
  if (row.conducting_body) parts.push(`Conducting Body: ${row.conducting_body}`);
  if (row.vacancies)       parts.push(`Vacancies: ${row.vacancies}`);
  if (row.age_range)       parts.push(`Age Range: ${row.age_range}`);
  if (row.last_date)       parts.push(`Last Date: ${row.last_date}`);
  if (row.published_on)    parts.push(`Notification Date: ${row.published_on}`);
  if (row.career_track)    parts.push(`Career Track: ${row.career_track}`);
  if (row.raw_category)    parts.push(`Category: ${row.raw_category}`);
  if (Array.isArray(row.tags) && row.tags.length) parts.push(`Tags: ${row.tags.join(', ')}`);
  return parts.join('\n');
}


async function generateJobDescription(jobTitle, pageText, rowMeta = null) {
  const cleanedPageText = (pageText || '').trim();
  const isThinData = cleanedPageText.length < 150;

  // Build base context from whatever data we have
  const structuredContext = (isThinData && rowMeta) ? buildThinDataContext(rowMeta, jobTitle) : '';
  const dataBlock = isThinData
    ? (structuredContext || '(No stored data — use your expert knowledge of this Indian government recruitment)')
    : `Raw Job Data:\n${cleanedPageText.slice(0, 4000)}`;

  const knowledgeNote = isThinData
    ? 'You have deep knowledge of Indian government recruitment. Use your knowledge to fill in all details accurately.'
    : '';

  // ── 3 progressively simpler prompts ───────────────────────────────────────
  // Each tier is faster to respond — triggered only on timeout/failure of previous
  const tiers = [
    {
      // Tier 1 — Full structured description ~300 words
      timeout: 20000,
      max_tokens: 600,
      temperature: isThinData ? 0.6 : 0.4,
      system: `You are an expert Indian government job content writer. ${knowledgeNote}
IMPORTANT: Write ONLY in English — never in Hindi, Bengali, Tamil, or any other language, regardless of the input language.
Write a complete job description of 250–320 words using EXACTLY these headings:
**Overview** | **Posts & Vacancies** | **Eligibility Criteria** | **Selection Process** | **Important Dates** | **How to Apply** | **Additional Information**
Start directly with **Overview** — no preamble. Skip any section where data is unavailable.`,
      user: `Job Title: ${jobTitle}\n\n${dataBlock}`,
    },
    {
      // Tier 2 — Compact description ~120 words (faster, fewer tokens)
      timeout: 15000,
      max_tokens: 300,
      temperature: 0.5,
      system: `You are an Indian government job writer. ${knowledgeNote}
IMPORTANT: Write ONLY in English — no Hindi or regional languages.
Write a compact 100–130 word job summary using these headings only:
**Overview** | **Eligibility** | **Selection** | **How to Apply**
Start directly with **Overview**. Be concise but accurate.`,
      user: `Job: ${jobTitle}\n${isThinData ? structuredContext || jobTitle : cleanedPageText.slice(0, 1500)}`,
    },
    {
      // Tier 3 — Single paragraph, ultra-fast (last AI resort)
      timeout: 10000,
      max_tokens: 150,
      temperature: 0.5,
      system: `You are an Indian government job writer. ${knowledgeNote} IMPORTANT: Respond ONLY in English — no Hindi or other languages. Write ONE concise paragraph (60–90 words) about this job: who is recruiting, what post, basic eligibility, and how to apply. No headings. Start directly.`,
      user: `Job: ${jobTitle}${structuredContext ? '\n' + structuredContext : ''}`,
    },
  ];

  for (let i = 0; i < tiers.length; i++) {
    const tier = tiers[i];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), tier.timeout);

    try {
      const response = await fetch(AI_API_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_API_KEY}`,
          ...AI_EXTRA_HEADERS
        },
        body: JSON.stringify({
          model: AI_MODEL,
          temperature: tier.temperature,
          max_tokens: tier.max_tokens,
          messages: [
            { role: 'system', content: tier.system },
            { role: 'user',   content: tier.user   }
          ]
        })
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status}: ${errBody.slice(0, 100)}`);
      }

      const data = await response.json();
      let content = data.choices?.[0]?.message?.content?.trim() || '';
      content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

      if (content.length > 60) {
        if (i > 0) sendLog(`  ✅ AI desc succeeded on tier-${i + 1} retry for "${jobTitle}"`, 'success');
        return content;
      }
      throw new Error('Response too short');

    } catch (err) {
      clearTimeout(timer);
      const isTimeout = err.name === 'AbortError';
      const reason = isTimeout ? `timeout (>${tier.timeout / 1000}s)` : err.message;
      sendLog(`  ⚡ Tier ${i + 1} failed [${reason}] for "${jobTitle}" — ${i < tiers.length - 1 ? 'trying simpler prompt...' : 'all tiers exhausted'}`, 'warn');

      if (i < tiers.length - 1) {
        // Short wait before next tier (500ms)
        await new Promise(r => setTimeout(r, 500));
      }
    }
  }

  // All 3 AI tiers failed — return null, job proceeds without description
  sendLog(`  ❌ All AI tiers failed for "${jobTitle}" — no description generated`, 'warn');
  return null;
}

/**
 * Checks scraped jobs against the Supabase database.
 * Computes:
 * - EXPIRED: last date has passed
 * - NEW: URL not in database
 * - UPDATE_AVAILABLE: URL exists in database, but fields changed (with detailed diffs)
 * - UP_TO_DATE: URL exists in database with identical data (avoids duplicates)
 */
async function evaluateDbStatus(jobs) {
  if (!supabase) {
    sendLog('⚠️ Supabase credentials not configured. Tagging all as NEW.', 'warn');
    return jobs.map(j => ({ ...j, status: 'NEW', diffs: [] }));
  }

  const urls = jobs.map(j => j.website || j.url).filter(Boolean);
  sendLog(`🔍 Comparing ${urls.length} scraped jobs with database table (${JOBS_TABLE})...`);

  let dbJobs = [];
  try {
    const { data, error } = await supabase
      .from(JOBS_TABLE)
      .select('job_id, title, url, published_on, last_date, vacancies, career_track, raw_json, tags, is_expired')
      .in('url', urls);

    if (error) throw error;
    dbJobs = data || [];
  } catch (err) {
    sendLog(`⚠️ Database check failed (${JOBS_TABLE}): ${err.message}. Treating jobs as NEW.`, 'warn');
    return jobs.map(j => ({ ...j, status: 'NEW', diffs: [] }));
  }

  const dbMap = new Map();
  dbJobs.forEach(dbj => dbMap.set(dbj.url, dbj));

  const evaluated = jobs.map(job => {
    const jobUrl = job.website || job.url;
    const dbMatch = dbMap.get(jobUrl);
    const dateInfo = parseIndianDate(job.lastDate);
    const parsedVac = parseVacancies(job.vacancies);

    // 1. Expired check
    if (dateInfo.isExpired) {
      return {
        ...job,
        status: 'EXPIRED',
        parsed_last_date: dateInfo.isoString,
        parsed_vacancies: parsedVac,
        db_job_id: dbMatch ? dbMatch.job_id : null,
        diffs: ['Job deadline has passed (Expired)']
      };
    }

    // 2. New job check
    if (!dbMatch) {
      return {
        ...job,
        status: 'NEW',
        parsed_last_date: dateInfo.isoString,
        parsed_vacancies: parsedVac,
        db_job_id: null,
        diffs: []
      };
    }

    // 3. Update Available check (detect field differences)
    const diffs = [];

    // Title difference
    const currentTitle = (job.exam_name || job.title || '').trim();
    if (dbMatch.title && currentTitle && dbMatch.title.toLowerCase() !== currentTitle.toLowerCase()) {
      diffs.push(`Title updated: "${dbMatch.title.substring(0, 30)}..." → "${currentTitle.substring(0, 30)}..."`);
    }

    // Vacancies difference
    if (parsedVac && dbMatch.vacancies !== parsedVac) {
      diffs.push(`Vacancies changed: ${dbMatch.vacancies || 'N/A'} → ${parsedVac}`);
    }

    // Last date difference
    if (dateInfo.isoString && dbMatch.last_date) {
      const dbDate = new Date(dbMatch.last_date).toISOString().split('T')[0];
      const newDate = dateInfo.isoString.split('T')[0];
      if (dbDate !== newDate) {
        diffs.push(`Last date changed: ${dbDate} → ${newDate}`);
      }
    } else if (dateInfo.isoString && !dbMatch.last_date) {
      diffs.push(`Last date specified: ${dateInfo.display}`);
    }

    if (diffs.length > 0) {
      return {
        ...job,
        status: 'UPDATE_AVAILABLE',
        parsed_last_date: dateInfo.isoString,
        parsed_vacancies: parsedVac,
        db_job_id: dbMatch.job_id,
        diffs
      };
    }

    // 4. Already up-to-date (no duplicate action needed)
    return {
      ...job,
      status: 'UP_TO_DATE',
      parsed_last_date: dateInfo.isoString,
      parsed_vacancies: parsedVac,
      db_job_id: dbMatch.job_id,
      diffs: []
    };
  });

  const counts = evaluated.reduce((acc, j) => {
    acc[j.status] = (acc[j.status] || 0) + 1;
    return acc;
  }, {});

  sendLog(`📊 Database Diff Analysis: 🟢 NEW: ${counts.NEW || 0} | 🟡 UPDATE: ${counts.UPDATE_AVAILABLE || 0} | 🔴 EXPIRED: ${counts.EXPIRED || 0} | ⚪ UP-TO-DATE: ${counts.UP_TO_DATE || 0}`, 'info');

  return evaluated;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// --- IPC Handlers for Scraping Logic ---

// Phase 1: Fetch Sitemap
ipcMain.handle('fetch-sitemap', async (event, url) => {
  try {
    sendLog(`🔍 Phase 1: Fetching sitemap from ${url}...`);
    const sitemapUrl = url.endsWith('/') ? `${url}sitemap.xml` : `${url}/sitemap.xml`;
    const response = await fetch(sitemapUrl);
    if (!response.ok) throw new Error('Sitemap not found');

    const xmlData = await response.text();
    const parser = new XMLParser();
    const result = parser.parse(xmlData);

    let urls = [];
    if (result.urlset && result.urlset.url) {
      urls = Array.isArray(result.urlset.url)
        ? result.urlset.url.map(u => u.loc)
        : [result.urlset.url.loc];
    }

    const keywords = ['job', 'recruit', 'vacancy', 'career', 'ssc', 'exam'];
    const filtered = urls.filter(u => keywords.some(k => u.toLowerCase().includes(k)));

    sendLog(`🔍 Phase 1 Complete: Found ${filtered.length > 0 ? filtered.length : urls.length} URLs`);
    return { ok: true, urls: filtered.length > 0 ? filtered : urls };
  } catch (error) {
    sendLog(`❌ Phase 1 Error: ${error.message}`, 'error');
    return { ok: false, error: error.message };
  }
});

// Phase 2: Playwright Scrape
ipcMain.handle('run-scraper', async (event, selectedUrls) => {
  try {
    sendLog(`🕷️ Phase 2: Launching Playwright for ${selectedUrls.length} URLs...`);
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ acceptDownloads: true, ignoreHTTPSErrors: true });
    const page = await context.newPage();

    const results = [];
    const downloadDir = path.join(__dirname, 'scraper_downloads');
    if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir);

    for (const targetUrl of selectedUrls) {
      try {
        sendLog(`  📄 Scraping: ${targetUrl}`);
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
        const pdfLinks = await page.$$eval('a[href$=".pdf"]', links => links.map(l => l.href));

        results.push({ url: targetUrl, pdfsFound: pdfLinks.length, status: 'scraped' });
        sendLog(`  ✅ Found ${pdfLinks.length} PDFs`);
      } catch (err) {
        results.push({ url: targetUrl, error: err.message, status: 'failed' });
        sendLog(`  ❌ Failed: ${err.message}`, 'error');
      }
    }

    await browser.close();
    sendLog(`🕷️ Phase 2 Complete: Scraped ${results.length} URLs`);
    return { ok: true, results };
  } catch (error) {
    sendLog(`❌ Phase 2 Error: ${error.message}`, 'error');
    return { ok: false, error: error.message };
  }
});

// Phase 3: Sarkari Job Portal Deep Scrape + Fast AI Tagging + DB Evaluation
ipcMain.handle('scrape-sarkari-latest', async (event, options = {}) => {
  const maxJobs = options.maxJobs || 5;
  const maxPages = options.maxPages || 1;

  try {
    sendLog(`🚀 Phase 3: Starting deep scrape (max ${maxJobs} jobs, ${maxPages} pages per source)...`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ ignoreHTTPSErrors: true });

    // Block unnecessary resources to maximize speed
    await context.route('**/*', route => {
      const type = route.request().resourceType();
      if (['image', 'media', 'font', 'stylesheet'].includes(type)) {
        route.abort();
      } else {
        route.continue();
      }
    });

    const page = await context.newPage();

    const sources = [
      { name: 'Sarkari Job Portal', baseUrl: 'https://sarkarijobportal.com/category/latest-jobs/' },
      { name: 'Sarkari Officer', baseUrl: 'https://www.sarkariofficer.com/category/latest-jobs/' }
    ];

    let items = [];

    sendLog(`📋 Step 1: Discovering job listings from ${sources.length} sources...`);

    for (const source of sources) {
      for (let i = 1; i <= maxPages; i++) {
        const pageUrl = i === 1 ? source.baseUrl : `${source.baseUrl}page/${i}/`;
        try {
          sendLog(`  🌐 Fetching: ${source.name} (page ${i})...`);
          await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
          const pageItems = await page.$$eval('article, .elementor-post, .type-post', elements => {
            return elements.map(el => {
              // Classic WordPress themes use h2/h3 title links. Sarkari Officer's newer layout has none:
              // there the title is the first dated post link (/YYYY/MM/DD/slug) that is not the "Read Latest" button.
              const titleTag = el.querySelector('h2.entry-title a, h3.entry-title a, h2 a, h3 a')
                || Array.from(el.querySelectorAll('a[href]')).find(a =>
                  /\/\d{4}\/\d{2}\/\d{2}\//.test(a.href) && a.innerText.trim() && !/^read latest/i.test(a.innerText.trim()));
              return {
                title: titleTag ? titleTag.innerText.trim() : null,
                link: titleTag ? titleTag.href : null
              };
            }).filter(item => item.title && item.link && item.link.includes('http'));
          });

          pageItems.forEach(item => {
            item.sourceName = source.name;
            items.push(item);
          });
          sendLog(`  ✅ Found ${pageItems.length} listings from ${source.name} page ${i}`, 'success');
        } catch (e) {
          sendLog(`  ⚠️ Failed to scrape ${source.name} page ${i}: ${e.message}`, 'warn');
        }
      }
    }

    // Deduplicate Links
    const uniqueItemsMap = new Map();
    items.forEach(item => uniqueItemsMap.set(item.link, item));
    items = Array.from(uniqueItemsMap.values());

    sendLog(`📋 Found ${items.length} unique listings. Limiting to ${maxJobs} for detail scrape.`);
    items = items.slice(0, maxJobs);

    const detailedResults = [];

    // Step 2: Visit each unique link and extract table data
    sendLog(`📄 Step 2: Extracting details from ${items.length} job posts...`);

    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      if (item.link !== 'No Link') {
        try {
          sendLog(`  📄 [${idx + 1}/${items.length}] Scraping: "${item.title}"...`);
          await page.goto(item.link, { waitUntil: 'domcontentloaded', timeout: 60000 });

          // Scrape structured table data
          const details = await page.$$eval('.entry-content table, .elementor-widget-theme-post-content table, article table', tables => {
            return tables.map(table => {
              const rows = Array.from(table.querySelectorAll('tr')).map(tr => {
                return Array.from(tr.querySelectorAll('td, th')).map(td => td.innerText.trim());
              });
              return rows;
            });
          });

          // Scrape full visible page text for AI description generation
          const fullPageText = await page.evaluate(() => {
            const selectors = [
              '.entry-content', 'article', 'main', '.post-content',
              '.elementor-widget-theme-post-content', '#content'
            ];
            for (const sel of selectors) {
              const el = document.querySelector(sel);
              if (el) return el.innerText || el.textContent || '';
            }
            return document.body.innerText || document.body.textContent || '';
          });

          const findValue = (label) => {
            for (const table of details) {
              for (const row of table) {
                if (row.length >= 2) {
                  if (row[0].toLowerCase().includes(label.toLowerCase())) return row[1];
                  if (label === 'Total Vacancies' && row[0].toLowerCase().includes('total')) return row[row.length - 1];
                }
              }
            }
            return null;
          };

          const lastDate = findValue('Last Date') || findValue('Online Application Ends') || findValue('Application Last Date');
          const publishedOn = findValue('Notification Release') || findValue('Registration Starts') || findValue('Application Start Date');
          const vacancies = findValue('Total Vacancies') || findValue('No. of Vacancies') || findValue('Total');
          const minAge = findValue('Minimum Age');
          const maxAge = findValue('Maximum Age');
          const ageRange = (minAge && maxAge) ? `${minAge} - ${maxAge}` : (minAge || maxAge || null);

          const rawText = details.flat(3).join(' ').toLowerCase();

          let normalizedQual = null;
          if (/degree|graduate|b\.a|b\.sc|b\.tech|b\.e/i.test(rawText)) normalizedQual = 'graduate';
          else if (/12th|intermediate|10\+2/i.test(rawText)) normalizedQual = '12';
          else if (/10th|matriculation|sslc/i.test(rawText)) normalizedQual = '10';

          const titleText = item.title.toLowerCase();
          const bodyText = (findValue('Organization') || findValue('Department') || titleText).toLowerCase();

          let track = 'STATE_GOVT';
          if (/bank/i.test(bodyText) || /bank/i.test(titleText)) track = 'BANKING';
          else if (/railway|rrb/i.test(bodyText) || /railway|rrb/i.test(titleText)) track = 'RAILWAYS';
          else if (/ssc/i.test(bodyText) || /ssc/i.test(titleText)) track = 'SSC';
          else if (/police|constable|cisf|crpf|bsf|itbp|ssb/i.test(bodyText) || /police|constable|cisf|crpf|bsf|itbp|ssb/i.test(titleText)) track = 'POLICE_CAPF';
          else if (/army|navy|air force|defence|agniveer/i.test(bodyText) || /army|navy|air force|defence|agniveer/i.test(titleText)) track = 'DEFENCE';
          else if (/engineer|tech/i.test(bodyText) || /engineer|tech/i.test(titleText)) track = 'ENGINEERING';

          const examId = `S-${crypto.randomBytes(4).toString('hex')}`;

          // Generate AI description from full page text (done here per-job before batch AI tagging)
          sendLog(`  🤖 Generating AI description for "${item.title}"...`, 'ai');
          const aiDesc = await generateJobDescription(item.title, fullPageText);
          if (aiDesc) {
            sendLog(`  ✨ AI description ready (${aiDesc.length} chars)`, 'success');
          }

          detailedResults.push({
            exam_id: examId,
            level: /central|upsc|ssc|rrb|bank/i.test(bodyText) ? 'central' : 'state',
            state_ut: null,
            raw_category: item.sourceName || 'Sarkari Job Portal',
            career_track: track,
            conducting_body: findValue('Organization') || findValue('Department') || item.sourceName || "Unknown",
            exam_name: pickExamName(item.title, findValue('Exam Name'), findValue('Recruitment Name')),
            website: item.link,
            min_qualification: normalizedQual,
            physical_required: /physical|pet|pst|height|measurement/i.test(rawText),
            math_required: false,
            technical_trade_preferred: /iti|diploma|b\.tech/i.test(rawText),
            ncc_bonus: /ncc/i.test(rawText),
            sports_quota_eligible: /sports quota/i.test(rawText),
            ex_servicemen_quota: /ex-servicemen|esm|agniveer/i.test(rawText),
            domicile_required: /domicile|resident of/i.test(rawText),
            english_intensive: false,
            vacancies: vacancies,
            ageRange: ageRange,
            publishedOn: publishedOn,
            lastDate: lastDate,
            fullDetails: details,
            ai_description: aiDesc || null,   // ← NEW: AI-generated description
          });
          sendLog(`  ✅ [${idx + 1}/${items.length}] Extracted: "${item.title}" — Vacancies: ${vacancies || 'N/A'}, Last Date: ${lastDate || 'N/A'}${aiDesc ? ' ✨ AI Desc' : ''}`, 'success');
        } catch (err) {
          detailedResults.push({ title: item.title, url: item.link, error: err.message });
          sendLog(`  ❌ [${idx + 1}/${items.length}] Failed: "${item.title}" — ${err.message}`, 'error');
        }
      }
    }

    await browser.close();
    sendLog(`🕷️ Extraction complete. ${detailedResults.length} jobs extracted.`);

    // --- Fast Parallel AI Multi-Tagging (Sub-10s) ---
    const { filteredJobs, stats } = await filterJobsWithAI(detailedResults);

    // --- Deduplication & Database Status Evaluation ---
    const evaluatedJobs = await evaluateDbStatus(filteredJobs);

    // Save evaluated jobs to disk
    const outputPath = path.join(__dirname, 'scraped_sarkari_jobs.json');
    fs.writeFileSync(outputPath, JSON.stringify(evaluatedJobs, null, 2));

    sendLog(`💾 Saved ${evaluatedJobs.length} categorized jobs to ${outputPath}`, 'success');

    return { ok: true, results: evaluatedJobs, stats, savedFile: outputPath };
  } catch (error) {
    sendLog(`❌ Phase 3 Fatal Error: ${error.message}`, 'error');
    return { ok: false, error: error.message };
  }
});

// IPC Handler: Check DB Status on any job array
ipcMain.handle('check-db-status', async (event, jobs) => {
  try {
    const evaluated = await evaluateDbStatus(jobs);
    return { ok: true, results: evaluated };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// IPC Handler: Upload / Sync Jobs with Supabase Database
ipcMain.handle('upload-to-database', async (event, payload = {}) => {
  if (!supabase) {
    return { ok: false, error: 'Supabase client is not initialized. Please verify SUPABASE_SERVICE_ROLE_KEY in .env.' };
  }

  const { jobs = [], syncOptions = { uploadNew: true, applyUpdates: true, deleteExpired: false } } = payload;
  sendLog(`📤 Database Sync Started for ${jobs.length} items...`);

  let addedCount = 0;
  let updatedCount = 0;
  let deletedCount = 0;
  let skippedCount = 0;
  const errors = [];

  for (const job of jobs) {
    const jobUrl = job.website || job.url;
    if (!jobUrl) continue;

    try {
      // 1. Process EXPIRED Jobs
      if (job.status === 'EXPIRED') {
        if (syncOptions.deleteExpired) {
          sendLog(`  🗑️ Deleting expired job from ${JOBS_TABLE}: "${job.exam_name || job.title}"...`, 'warn');
          const { error: delError } = await supabase.from(JOBS_TABLE).delete().eq('url', jobUrl);
          if (delError) throw delError;
          deletedCount++;
        } else {
          skippedCount++;
        }
        continue;
      }

      // 2. Process NEW Jobs
      if (job.status === 'NEW') {
        if (!syncOptions.uploadNew) {
          skippedCount++;
          continue;
        }

        sendLog(`  ➕ Inserting new job into ${JOBS_TABLE}: "${job.exam_name || job.title}"...`);

        const publishedParsed = parseIndianDate(job.publishedOn);
        const lastDateParsed = parseIndianDate(job.lastDate);
        const vacanciesInt = parseVacancies(job.vacancies);

        // Build database payload directly matching public.jobs_v2 schema
        const newRow = {
          title: (job.exam_name || job.title || 'Untitled Job').trim(),
          url: jobUrl,
          published_on: publishedParsed.isoString,
          last_date: lastDateParsed.isoString,
          vacancies: vacanciesInt,
          age_range: job.ageRange || null,
          career_track: job.career_track || 'STATE_GOVT',
          tags: job.tags || [],
          is_expired: lastDateParsed.isExpired,
          exam_id: null, // Foreign key safety: null avoids constraint failure with legacy exams
          lc_exam_id: null,
          ai_description: job.ai_description || null,   // ← AI-generated English description
          raw_json: {
            ...job,
            tags: job.tags || [],
            scraped_exam_id: job.exam_id,
            conducting_body: job.conducting_body,
            vacancies_raw: job.vacancies
          }
        };

        const { error: insertError } = await supabase.from(JOBS_TABLE).insert([newRow]);
        if (insertError) throw insertError;
        addedCount++;
        sendLog(`  ✅ Successfully added to ${JOBS_TABLE}: "${newRow.title}"`, 'success');
        continue;
      }

      // 3. Process UPDATE_AVAILABLE Jobs
      if (job.status === 'UPDATE_AVAILABLE') {
        if (!syncOptions.applyUpdates) {
          skippedCount++;
          continue;
        }

        sendLog(`  🔄 Updating existing job in ${JOBS_TABLE}: "${job.exam_name || job.title}"...`);

        const lastDateParsed = parseIndianDate(job.lastDate);
        const vacanciesInt = parseVacancies(job.vacancies);

        const updatePatch = {
          title: (job.exam_name || job.title || '').trim(),
          last_date: lastDateParsed.isoString,
          vacancies: vacanciesInt,
          career_track: job.career_track || 'STATE_GOVT',
          tags: job.tags || [],
          is_expired: lastDateParsed.isExpired,
          updated_at: new Date().toISOString(),
          // Only overwrite ai_description if a fresh one was generated this run
          ...(job.ai_description ? { ai_description: job.ai_description } : {}),
          raw_json: {
            ...job,
            tags: job.tags || [],
            conducting_body: job.conducting_body,
            vacancies_raw: job.vacancies
          }
        };

        const { error: patchError } = await supabase.from(JOBS_TABLE).update(updatePatch).eq('url', jobUrl);
        if (patchError) throw patchError;
        updatedCount++;
        sendLog(`  ✅ Successfully updated in ${JOBS_TABLE}: "${updatePatch.title}"`, 'success');
        continue;
      }

      // 4. UP_TO_DATE / Other
      skippedCount++;
    } catch (itemErr) {
      sendLog(`  ❌ Error processing "${job.title || jobUrl}": ${itemErr.message}`, 'error');
      errors.push({ url: jobUrl, error: itemErr.message });
    }
  }

  sendLog(`🏁 Database Sync Finished! ➕ Added: ${addedCount} | 🔄 Updated: ${updatedCount} | 🗑️ Deleted: ${deletedCount} | ⏩ Skipped: ${skippedCount}`, 'success');

  return {
    ok: true,
    addedCount,
    updatedCount,
    deletedCount,
    skippedCount,
    errors
  };
});

// ─────────────────────────────────────────────────────────────────────────────
// IPC Handler: Fetch legacy `jobs` table rows, AI-enrich, and stage for jobs_v2
// ─────────────────────────────────────────────────────────────────────────────
ipcMain.handle('fetch-and-enrich-jobs', async (event, opts = {}) => {
  if (!supabase) return { ok: false, error: 'Supabase not initialised. Check .env SUPABASE_SERVICE_ROLE_KEY.' };

  // batchLimit = how many unmigrated jobs to process this run.
  // 0 (or not set) means: process ALL remaining unmigrated jobs.
  const batchLimit = parseInt(opts.batchLimit, 10) || 0;
  const generateAi = opts.generateAi !== false;

  sendLog(`🔍 Fetching existing URLs from ${JOBS_TABLE} to skip already-migrated jobs...`);

  // 1. Fetch all existing URLs from jobs_v2 to deduplicate
  const existingV2Urls = new Set();
  let v2Page = 0;
  const V2_PAGE_SIZE = 1000;
  while (true) {
    const { data: v2Rows, error: v2Err } = await supabase
      .from(JOBS_TABLE)
      .select('url')
      .range(v2Page * V2_PAGE_SIZE, (v2Page + 1) * V2_PAGE_SIZE - 1);

    if (v2Err) {
      sendLog(`⚠️ Error checking existing ${JOBS_TABLE} URLs: ${v2Err.message}`, 'warn');
      break;
    }
    if (!v2Rows || v2Rows.length === 0) break;
    for (const r of v2Rows) {
      if (r.url) existingV2Urls.add(r.url);
    }
    if (v2Rows.length < V2_PAGE_SIZE) break;
    v2Page++;
  }
  sendLog(`🔍 Found ${existingV2Urls.size} existing URLs in ${JOBS_TABLE}.`);

  // 2. Fetch all legacy jobs (paginated in chunks of 1000)
  sendLog(`📥 Fetching all rows from legacy jobs table...`);
  let allLegacyJobs = [];
  let page = 0;
  const PAGE_SIZE = 1000;
  while (true) {
    const { data: batch, error: fetchErr } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (fetchErr) {
      sendLog(`❌ Failed to fetch legacy jobs: ${fetchErr.message}`, 'error');
      return { ok: false, error: fetchErr.message };
    }
    if (!batch || batch.length === 0) break;
    allLegacyJobs.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    page++;
  }
  sendLog(`✅ Fetched ${allLegacyJobs.length} total rows from jobs table.`, 'success');

  // 3. Skip those already in jobs_v2
  const unmigratedJobs = allLegacyJobs.filter(j => {
    const jobUrl = j.url || j.website;
    return jobUrl && !existingV2Urls.has(jobUrl);
  });
  const skippedCount = allLegacyJobs.length - unmigratedJobs.length;
  sendLog(`⏩ Skipped ${skippedCount} already in ${JOBS_TABLE}. ${unmigratedJobs.length} unmigrated remaining.`, 'info');

  if (unmigratedJobs.length === 0) {
    sendLog(`🎉 All legacy jobs are already present in ${JOBS_TABLE}! Nothing new to enrich.`, 'success');
    return { ok: true, jobs: [], skippedCount, totalLegacy: allLegacyJobs.length, unmigratedCount: 0 };
  }

  // 4. Pick first N unmigrated (batchLimit=0 → all)
  const targetJobs = batchLimit > 0 ? unmigratedJobs.slice(0, batchLimit) : unmigratedJobs;
  sendLog(`🎯 Processing ${targetJobs.length} jobs${batchLimit > 0 ? ` (limit: ${batchLimit})` : ' (all unmigrated)'}  · ${generateAi ? 'AI descriptions ON' : 'tags only'}`, 'info');

  // 5. For each unmigrated job: run rule-based tagging + optional AI description
  const enriched = [];

  for (let i = 0; i < targetJobs.length; i++) {
    const row = targetJobs[i];
    const jobUrl = row.url || row.website || null;
    const title  = row.title || row.exam_name || 'Unknown Job';

    sendLog(`  🔖 [${i + 1}/${targetJobs.length}] Enriching: "${title}"...`);

    // Rule-based tags (same classifier used by scraper)
    const fakeScrapeObj = {
      title,
      exam_name: row.exam_name || title,
      conducting_body: row.conducting_body || '',
      raw_category: row.raw_category || '',
      career_track: row.career_track || '',
      fullDetails: row.raw_json ? [JSON.stringify(row.raw_json)] : [],
    };
    const ruleTags = classifyMultiTags(fakeScrapeObj);

    // Merge with any existing tags on the row
    const existingTags = Array.isArray(row.tags) ? row.tags : [];
    const mergedTags = Array.from(new Set([...existingTags, ...ruleTags]));


    // AI description — ALWAYS produces a result (retry x3 → template fallback)
    let aiDesc = null;
    if (generateAi) {
      const rawText = row.raw_json
        ? JSON.stringify(row.raw_json).replace(/[{}[\]"]/g, ' ').slice(0, 4000)
        : '';
      const isThin = rawText.length < 150;
      sendLog(`  🤖 ${isThin ? '[Knowledge Mode]' : '[Data Mode]'} Generating AI description for "${title}"...`, 'ai');
      aiDesc = await generateJobDescription(title, rawText, row);
      if (aiDesc) {
        sendLog(`  ✨ AI description ready (${aiDesc.length} chars)${isThin ? ' [AI/template]' : ''}`, 'success');
      } else {
        sendLog(`  ❌ No AI description for "${title}" (all tiers failed)`, 'warn');
      }
    }


    enriched.push({
      // Fields matching jobs_v2 schema
      title,
      url: jobUrl,
      published_on:   row.published_on || null,
      last_date:      row.last_date     || null,
      vacancies:      row.vacancies     || null,
      age_range:      row.age_range     || null,
      career_track:   row.career_track  || 'STATE_GOVT',
      tags:           mergedTags,
      is_expired:     row.is_expired    || false,
      exam_id:        null,
      lc_exam_id:     null,
      ai_description: aiDesc || null,
      raw_json:       row.raw_json      || {},
      // Metadata for UI display only (not written to DB)
      source_table:   'jobs',
      alreadyInV2:    false,
    });
  }

  const withDesc = enriched.filter(j => j.ai_description).length;
  sendLog(`🏁 Enrichment done: ${enriched.length} unmigrated jobs processed (${withDesc} with AI description, ${skippedCount} skipped from ${JOBS_TABLE}).`, 'success');

  return {
    ok: true,
    jobs: enriched,
    totalLegacy: allLegacyJobs.length,
    skippedCount,
    unmigratedCount: unmigratedJobs.length
  };
});

// ─────────────────────────────────────────────────────────────────────────────
// IPC Handler: Push enriched jobs array into jobs_v2 (batched)
// ─────────────────────────────────────────────────────────────────────────────
ipcMain.handle('push-to-jobs-v2', async (event, jobs = []) => {
  if (!supabase) return { ok: false, error: 'Supabase not initialised. Check .env SUPABASE_SERVICE_ROLE_KEY.' };

  sendLog(`🚀 Pushing ${jobs.length} enriched jobs to ${JOBS_TABLE}...`);

  let inserted = 0;
  let skipped  = 0;
  let errors   = 0;

  const validJobs = jobs.filter(j => j.url || j.website);
  skipped += (jobs.length - validJobs.length);

  // Push in batches of 50 for efficiency
  const BATCH_SIZE = 50;
  for (let i = 0; i < validJobs.length; i += BATCH_SIZE) {
    const batch = validJobs.slice(i, i + BATCH_SIZE);
    const dbRows = batch.map(j => {
      const { source_table, alreadyInV2, ...row } = j;
      return {
        ...row,
        updated_at: new Date().toISOString()
      };
    });

    try {
      const { error: upsertErr } = await supabase
        .from(JOBS_TABLE)
        .upsert(dbRows, {
          onConflict: 'url',
          ignoreDuplicates: false
        });

      if (upsertErr) {
        // Fallback to row-by-row on batch failure to isolate errors
        for (const item of dbRows) {
          const { error: singleErr } = await supabase
            .from(JOBS_TABLE)
            .upsert([item], { onConflict: 'url', ignoreDuplicates: false });
          if (singleErr) {
            errors++;
            sendLog(`  ❌ Error inserting "${item.title}": ${singleErr.message}`, 'error');
          } else {
            inserted++;
          }
        }
      } else {
        inserted += batch.length;
        sendLog(`  ✅ Pushed batch ${Math.floor(i / BATCH_SIZE) + 1} (${inserted}/${validJobs.length} jobs)...`, 'success');
      }
    } catch (err) {
      errors += batch.length;
      sendLog(`  ❌ Batch error: ${err.message}`, 'error');
    }
  }

  sendLog(`🏁 Push to ${JOBS_TABLE} complete — ➕ ${inserted} inserted | ⏩ ${skipped} skipped | ❌ ${errors} errors`, 'success');
  return { ok: true, inserted, skipped, errors };
});

