# Graph Report - veernxt-web  (2026-11-01)

## Corpus Check
- 279 files · ~0 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1705 nodes · 4207 edges · 109 communities (68 shown, 41 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 31 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- api/admin/save-resource.js (118)
- src/components/admin (65)
- sql/learning_center_schema.sql (64)
- src/lib/bannerStore.js (59)
- api/private-sector/router.js (56)
- api/admin/misc.js (56)
- src/components/finance (47)
- misc (44)
- src/pages/admin (44)
- src/lib/privateSectorTaxonomy.js (40)
- src/pages/admin (38)
- src/components/book (37)
- src/components/ui (36)
- src/components/book (35)
- misc (34)
- src/pages/Profiling.jsx (34)
- src/pages/admin (32)
- misc (29)
- src/pages/admin (28)
- src/pages/admin (27)
- src/components/CategoryExplorerPortal.jsx (26)
- src/components/ui (25)
- src/components/book (25)
- src/pages/admin (25)
- backend/engine (24)
- sql/private_sector.sql (23)
- src/components/quiz (23)
- src/components/JobBoard.jsx (23)
- backend/engine (22)
- src/components/book (22)
- src/hooks/useExamContent.js (22)
- src/lib/legalAidCellConfig.js (22)
- backend/engine (21)
- src/lib/subscriptionAccess.js (20)
- src/lib/jobMatcher.js (20)
- src/components/book (18)
- src/pages/LearningCenter.jsx (18)
- backend/engine (17)
- src/components/book (17)
- misc (16)
- src/lib/useSeo.js (15)
- src/lib/thumbnailStore.js (15)
- api/points/actions.js (14)
- src/pages/admin (14)
- src/pages/ProfilingTester.jsx (13)
- src/pages/StudyMaterialsPage.jsx (13)
- src/lib/thumbnailTaxonomy.js (13)
- backend/engine (12)
- src/components/admin (12)
- src/components/ExamContentPreview.jsx (12)
- src/components/book (12)
- src/pages/admin (11)
- src/components/AiChatbotWidget.jsx (11)
- src/pages/CVBuilder.jsx (11)
- sql/pyq_papers.sql (10)
- sql/rename_resources_v2_to_resources.sql (10)
- backend/engine (9)
- src/lib/contentEngineProcessor.js (9)
- src/pages/admin (9)
- sql/rewards_system.sql (8)
- src/lib/resourceMetadata.js (8)
- src/pages/admin (8)
- misc (7)
- src/components/admin (6)
- sql/points_system.sql (6)
- misc (5)
- src/components/PremiumSelect.jsx (5)
- sql/ps_recruiter_requests_create_and_migrate.sql (5)
- misc (5)
- sql/jobs_multi_tags_and_status.sql (4)
- sql/unify_exams_table.sql (4)
- sql/jobs_v2_ai_description.sql (3)
- sql/exams_thumbnail_subject.sql (3)
- sql/jobs_career_track_tag.sql (3)
- sql/jobs_lc_exam_link.sql (3)
- src/lib/useInlineUnlock.js (3)
- sql/book_covers.sql (2)
- sql/lc_exam_categories.sql (2)
- sql/lc_thumbnails.sql (2)
- sql/legal_aid_queries.sql (2)
- sql/reader_themes.sql (2)
- sql/site_banners.sql (2)
- src/components/book (2)
- src/lib/examCategoryTaxonomy.js (2)
- src/lib/pointsCatalog.js (2)
- src/pages/FindCandidates.jsx (1)
- src/pages/FindCandidates.jsx (1)
- src/pages/FindCandidates.jsx (1)

## God Nodes (most connected - your core abstractions)
1. `react` - 124 edges
2. `lucide-react` - 106 edges
3. `App()` - 71 edges
4. `supabase` - 60 edges
5. `react-router-dom` - 58 edges
6. `BlockRenderer()` - 31 edges
7. `Select()` - 31 edges
8. `adminFrom()` - 29 edges
9. `handler()` - 28 edges
10. `Button` - 28 edges

## Surprising Connections (you probably didn't know these)
- `loadAllExams()` --calls--> `inferState()`  [EXTRACTED]
  api/profile/recommend.js → backend/engine/eligibility.js
- `handler()` --calls--> `scoreExam()`  [EXTRACTED]
  api/profile/recommend.js → backend/engine/scoring.js
- `handler()` --calls--> `buildIdempotencyKey()`  [EXTRACTED]
  api/profile/recommend.js → backend/points/pointsCatalog.js
- `handler()` --calls--> `resolvePoints()`  [EXTRACTED]
  api/profile/recommend.js → backend/points/pointsCatalog.js
- `getR2Config()` --calls--> `getS3Client()`  [EXTRACTED]
  api/admin/save-resource.js → scripts/lib/ingest-drive-content.js

## Import Cycles
- None detected.

## Communities (109 total, 41 thin omitted)

### Community 0 - "api/admin/save-resource.js (118)"
Cohesion: 0.05
Nodes (105): BOOK_CATEGORIES, BOOK_LEVELS, bookCoverKey(), bookRowsFilter(), booksListCache, checkAdminSecret(), deepReplaceStrings(), deleteR2Keys() (+97 more)

### Community 1 - "src/components/admin (65)"
Cohesion: 0.05
Nodes (60): addBtnStyle, BLOCK_TYPE_LABELS, BlockEditForm(), BlockFields(), BlockTypePicker(), createBlock(), fieldStyle, genBlockId() (+52 more)

### Community 2 - "sql/learning_center_schema.sql (64)"
Cohesion: 0.05
Nodes (47): idx_exams_has_english_subject, idx_lc_exams_has_english_subject, idx_exams_has_hindi_subject, idx_lc_exams_has_hindi_subject, lc_exam_intro, idx_lc_exam_legacy_map_legacy, lc_exam_legacy_map, idx_lc_exam_quiz_map_confidence (+39 more)

### Community 3 - "src/lib/bannerStore.js (59)"
Cohesion: 0.07
Nodes (41): CTASection(), EmployerPortal(), Hero(), LandingFooter(), LandingPage(), NavBar(), OnboardingProcess(), PrimaryServiceOfferings() (+33 more)

### Community 4 - "api/private-sector/router.js (56)"
Cohesion: 0.08
Nodes (50): checkSecret(), getSupabaseAdmin(), handleList(), handler(), handleSendEmail(), handleUpdateStatus(), broadcastJobApprovalEmail(), buildJobEmailTemplate() (+42 more)

### Community 5 - "api/admin/misc.js (56)"
Cohesion: 0.06
Nodes (48): getSupabaseAdmin(), handleAdminInvite(), handleAdminRemove(), handleAdminsList(), handler(), handleRedemptionsList(), handleRedemptionUpdate(), handleTableWrite() (+40 more)

### Community 6 - "src/components/finance (47)"
Cohesion: 0.09
Nodes (35): FinancialCalculatorModal(), FinancialCalculatorModalContent(), formatTickINR(), iconMap, VisualChart(), FINANCIAL_PLANNING_TOOLS, GOAL_PLANNING_TOOLS, FinancialPlanningSuite() (+27 more)

### Community 7 - "misc (44)"
Cohesion: 0.09
Nodes (40): public.chat_messages, public.connections, public.employer_profiles, public.exams, public.jobs, public.jobs_v2, public.lc_conducting_bodies, public.lc_exam_categories (+32 more)

### Community 8 - "src/pages/admin (44)"
Cohesion: 0.09
Nodes (35): html-to-image, COVER_H, COVER_W, DEFAULT_COVER, LAYOUT_CONTROLS, LAYOUT_DEFAULTS, SPINE_W, TOPIC_ICONS (+27 more)

### Community 9 - "src/lib/privateSectorTaxonomy.js (40)"
Cohesion: 0.10
Nodes (35): computeCapabilityFit(), DUTY_GROUPS, getRecommendedWorkTypeIds(), getRecommendedWorkTypes(), QUALIFICATION_AREAS, RANK_OPTIONS, resolveSectorKey(), SECTOR_CAPABILITY_MAP (+27 more)

### Community 10 - "src/pages/admin (38)"
Cohesion: 0.10
Nodes (28): react-dom, App(), BodyThemeSync(), RootRoute(), AuthGuard(), MessagingWorkspace(), errorIconStyle, PaymentPage() (+20 more)

### Community 11 - "src/components/book (37)"
Cohesion: 0.17
Nodes (33): callAdminApi(), checkTableExists(), DEFAULT_CATEGORY_THEMES, deleteCustomTheme(), fetchCategoryDefaultThemes(), fetchCustomThemes(), fetchThemeById(), getCategoryDefaultThemeId() (+25 more)

### Community 12 - "src/components/ui (36)"
Cohesion: 0.11
Nodes (19): lucide-react, FirstLoginModal(), Footer(), AccountMenu(), Tabs(), ThemeToggle(), ThemeContext, useTheme() (+11 more)

### Community 13 - "src/components/book (35)"
Cohesion: 0.14
Nodes (28): BlockRenderer(), ChapterHeader(), cleanHeadingContent(), cleanParagraphContent(), ComparisonTableBlock(), DefinitionBlock(), ExamAlertBlock(), ExampleBlock() (+20 more)

### Community 14 - "misc (34)"
Cohesion: 0.06
Nodes (34): dependencies, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, axios, docx, dotenv, @google/generative-ai, html-to-docx (+26 more)

### Community 15 - "src/pages/Profiling.jsx (34)"
Cohesion: 0.11
Nodes (27): ChoiceGroup(), ChoiceGroupStyles(), MultiChoiceGroup(), GuidedStep(), STATE_DISTRICTS, getEmployerInsights(), loadDraft(), useLocalDraft() (+19 more)

### Community 16 - "src/pages/admin (32)"
Cohesion: 0.12
Nodes (27): BatchSyncBooksModal(), examsAlreadyHavingResource(), findMatchingCounterpartBook(), inChunks(), isSameResource(), loadBookLinks(), loadResourceKeys(), normTitle() (+19 more)

### Community 17 - "misc (29)"
Cohesion: 0.08
Nodes (27): name, private, type, version, @aws-sdk/s3-request-presigner, docx, dotenv, eslint (+19 more)

### Community 18 - "src/pages/admin (28)"
Cohesion: 0.13
Nodes (20): adminFrom(), CENTRAL_EXAM_CATEGORIES, STATE_EXAM_CATEGORIES, UT_EXAM_CATEGORIES, CategoriesPage(), LEVEL_BADGE_COLOR, LEVEL_FILTER_OPTIONS, LEVEL_LABELS (+12 more)

### Community 19 - "src/pages/admin (27)"
Cohesion: 0.15
Nodes (22): DropdownIndicator(), reactSelectStyles, Select(), AdminJobs(), CategoryTag(), JobDetailDrawer(), toDateInputValue(), deleteExamRow() (+14 more)

### Community 20 - "src/components/CategoryExplorerPortal.jsx (26)"
Cohesion: 0.13
Nodes (17): CategoryExplorerPortal(), loadJobs(), divisionFilterCache, getExamRichCardData(), getJobsV2Cached(), laptopRailDefault(), matchJobsForExam(), renderCardIcon() (+9 more)

### Community 21 - "src/components/ui (25)"
Cohesion: 0.18
Nodes (16): motion, Button, SIZE_STYLES, VARIANT_STYLES, Card, PADDING, Sheet(), EmployerReadyToHire() (+8 more)

### Community 22 - "src/components/book (25)"
Cohesion: 0.16
Nodes (19): react-pageflip, FlipbookReader(), Page, ReaderTTSBar(), SPEED_OPTIONS, cleanTextForSpeech(), extractSpeechSegments(), getRankedVoices() (+11 more)

### Community 23 - "src/pages/admin (25)"
Cohesion: 0.15
Nodes (14): react-router-dom, escapeForOrFilter(), resolveBodyExamNames(), useLearningContent(), supabase, THUMBNAIL_SUBJECTS, SUBJECT_OPTIONS, LEVEL_FILTER_OPTIONS (+6 more)

### Community 24 - "backend/engine (24)"
Cohesion: 0.08
Nodes (23): AGNIVEER_AGE_RELAXATION_YEARS, CATEGORY_RESERVATION_BONUS, CHARACTER_BONUS, CHARACTER_REQUIRED_TRACKS, DOMICILE_MATCH_BONUS, DOMICILE_MISMATCH_PENALTY, ENGLISH_PENALTY_FOR_INTENSIVE_IF_BASIC, ENGLISH_WEIGHTS (+15 more)

### Community 25 - "sql/private_sector.sql (23)"
Cohesion: 0.16
Nodes (19): ps_candidate_interest, ps_candidate_interest_pipeline_status_idx, ps_candidate_interest_requirement_id_idx, ps_candidate_interest_user_id_idx, ps_candidate_profiles, ps_candidate_profiles_user_id_idx, ps_job_requirements, ps_job_requirements_employer_id_idx (+11 more)

### Community 26 - "src/components/quiz (23)"
Cohesion: 0.17
Nodes (16): InteractiveQuiz(), QuizResults(), QuizSetup(), QuizView(), calculateQuestionScore(), getRankTier(), BLOCKING_FLAGS_FILTER, BLOCKING_QUESTION_FLAGS (+8 more)

### Community 27 - "src/components/JobBoard.jsx (23)"
Cohesion: 0.16
Nodes (17): CategoryTag(), FilterSection(), isVeteranFriendly(), JobBoard(), JobCard(), JobDetailPanel(), VETERAN_FRIENDLY_TRACKS, CAREER_TRACK_META (+9 more)

### Community 28 - "backend/engine (22)"
Cohesion: 0.14
Nodes (16): diversify(), fetchPreFilteredExams(), handler(), profileSchema, QUAL_DB_RANK, QUAL_RANK_MAP, summariseProfile(), summariseSkillGaps() (+8 more)

### Community 30 - "src/hooks/useExamContent.js (22)"
Cohesion: 0.16
Nodes (19): TodayObjectiveCard(), careerTrackKeyword(), countProgress(), fetchExamIntro(), fetchMappedResources(), fetchQuizzesForExam(), fetchResourcesFallback(), getExamResourceCount() (+11 more)

### Community 31 - "src/lib/legalAidCellConfig.js (22)"
Cohesion: 0.18
Nodes (19): classifyFreeform(), composeProfileLine(), computeUrgency(), genCaseRef(), legalCategories, legalFlows, profileFieldsConfig, profiles (+11 more)

### Community 32 - "backend/engine (21)"
Cohesion: 0.10
Nodes (19): bankingClerk, bankingInfantry, bankingTechnical, bankRecClerk, bankRecInfantry, bankRecTech, BENCHMARK_JOBS, __dirname (+11 more)

### Community 33 - "src/lib/subscriptionAccess.js (20)"
Cohesion: 0.17
Nodes (12): fetchTier(), canTakeQuiz(), getEffectiveTier(), isSubscriptionActive(), isTierAtLeast(), PLAN_DETAILS, TIER_RANK, TIERS (+4 more)

### Community 34 - "src/lib/jobMatcher.js (20)"
Cohesion: 0.17
Nodes (17): JobDescriptionModal(), FORM_CODE_TO_BUCKET, getRecommendedCivilianRoles(), matchJobsV2ForExam(), matchJobsV2ForRecommendations(), normalisePreferences(), normalizeState(), safeArray() (+9 more)

### Community 35 - "src/components/book (18)"
Cohesion: 0.18
Nodes (12): DEFAULT_THEME_ID, readerThemes, ALL_TOKEN_KEYS, DEFAULT_TOKENS, FONT_SCALE_MAX, FONT_SCALE_MIN, FONT_SCALE_STEP, TOKEN_GROUPS (+4 more)

### Community 36 - "src/pages/LearningCenter.jsx (18)"
Cohesion: 0.17
Nodes (17): useThumbnails(), buildExamSummary(), CATEGORY_CLUSTERS, DYNAMIC_PALETTE, examMatchesCategory(), formatTimeAgo(), getCategoryIconMeta(), getInitialActiveLearning() (+9 more)

### Community 37 - "backend/engine (17)"
Cohesion: 0.12
Nodes (13): __dirname, examMaster, examMasterPath, __filename, FIRST_20, PRIORITY_TRACKS, QUAL_DB_RANK, QUAL_RANK_MAP (+5 more)

### Community 38 - "src/components/book (17)"
Cohesion: 0.23
Nodes (14): audioBuffers, audioPool, buildAudioPool(), getAudioContext(), loadAudioBuffers(), playFlipSound(), SOUND_FILES, unlockAudio() (+6 more)

### Community 39 - "misc (16)"
Cohesion: 0.12
Nodes (16): devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, @google/genai, p-limit (+8 more)

### Community 40 - "src/lib/useSeo.js (15)"
Cohesion: 0.24
Nodes (7): react, upsertCanonical(), upsertMeta(), useSeo(), Legal(), PrivacyPolicy(), Support()

### Community 41 - "src/lib/thumbnailStore.js (15)"
Cohesion: 0.21
Nodes (12): BUNDLED_CATEGORY_THUMBNAILS, bundledCategoryThumbnail(), slugifyCategory(), bundledSubjectThumbnail(), EMPTY, ensureLoaded(), listeners, load() (+4 more)

### Community 42 - "api/points/actions.js (14)"
Cohesion: 0.25
Nodes (12): awardBodySchema, getSupabaseAdmin(), handleAward(), handler(), handleRedeem(), REDEEM_ERROR_STATUS, redeemBodySchema, buildIdempotencyKey() (+4 more)

### Community 43 - "src/pages/admin (14)"
Cohesion: 0.23
Nodes (13): AdminLegalAid(), apiCall(), buildAdvocateBody(), buildAdvocateSubject(), buildVeteranBody(), buildVeteranSubject(), CATEGORY_LABELS, Pill() (+5 more)

### Community 44 - "src/pages/ProfilingTester.jsx (13)"
Cohesion: 0.23
Nodes (11): ALL_SKILLS, BENCHMARK_JOBS, CAREER_TRACK_OPTIONS, COMMON_ARMS, computeJaccardSimilarity(), fetchJobsV2Cached(), JobDescriptionViewer(), matchJobsV2ForExam() (+3 more)

### Community 45 - "src/pages/StudyMaterialsPage.jsx (13)"
Cohesion: 0.21
Nodes (9): BOOK_COVERS_MAP, getBookCoverUrl(), STATE_COVERS_MAP, BOOK_CONTENT_COMBINATIONS, CATALOG_BOOKS, getRandomCombination(), HERO_PILLS, HeroPills() (+1 more)

### Community 46 - "src/lib/thumbnailTaxonomy.js (13)"
Cohesion: 0.21
Nodes (12): CORE_TITLE_TO_SUBJECT, DEFAULT_THUMBNAIL_SUBJECT, isIntroCategory(), LABEL_ALIASES, LABEL_TO_KEY, NORMALIZED_CORE_TITLES, normalizeTitle(), REGION_GS_TITLE_PATTERN (+4 more)

### Community 47 - "backend/engine (12)"
Cohesion: 0.20
Nodes (8): getSupabaseClient(), loadAllExams(), ARM_CORPS_MAP, compiledDesignations, __dirname, __filename, TRADE_MAP, VAGUE_INPUTS

### Community 48 - "src/components/admin (12)"
Cohesion: 0.26
Nodes (9): cardStyle, emptyQuestion(), iconBtnStyle, labelStyle, QuestionEditorList(), renumber(), textAreaStyle, QuestionSetPreview() (+1 more)

### Community 49 - "src/components/ExamContentPreview.jsx (12)"
Cohesion: 0.24
Nodes (10): BUCKETS, CATEGORY_BADGES, ExamContentPreview(), LIST_SECTIONS, QuizRow(), ResourceRow(), ResourceTile(), SUBJECT_CATEGORY_LABELS (+2 more)

### Community 50 - "src/components/book (12)"
Cohesion: 0.35
Nodes (8): ReaderThemeContext, READER_THEME_LIST, ThemeSwatch(), ThemeSwitcher(), useReaderTheme(), AdminResourcePreview(), AssignedThemeControl(), fetchR2Json()

### Community 51 - "src/pages/admin (11)"
Cohesion: 0.22
Nodes (9): axios, getJobClass(), summarizeJobClasses(), AdminPrivateSector(), call(), PIPELINE_STATUSES, REQUIREMENT_STATUSES, SECTIONS (+1 more)

### Community 52 - "src/components/AiChatbotWidget.jsx (11)"
Cohesion: 0.22
Nodes (9): AiChatbotWidget(), CATEGORY_OVERVIEWS, getNodeSummary(), OPTION_META, POPULAR_QUESTIONS, renderFormattedMessage(), SPECIFIC_KNOWLEDGE_NODES, SUB_TOPIC_CHIPS (+1 more)

### Community 53 - "src/pages/CVBuilder.jsx (11)"
Cohesion: 0.18
Nodes (10): addBtnStyle, circleAddBtnStyle, iconMini, inputFieldStyle, labelHeaderStyle, sectionSpacing, sectionTitleStyle, selectStyle (+2 more)

### Community 54 - "sql/pyq_papers.sql (10)"
Cohesion: 0.29
Nodes (7): idx_pyq_papers_exam_name, idx_pyq_papers_subject, idx_pyq_questions_paper_id, pyq_papers, pyq_questions, idx_pyq_papers_lc_exam_id, idx_quizzes_lc_exam_id

### Community 55 - "sql/rename_resources_v2_to_resources.sql (10)"
Cohesion: 0.22
Nodes (6): i18next, i18next-browser-languagedetector, react-i18next, resources_v2, idx_resources_v2_format, resources

### Community 56 - "backend/engine (9)"
Cohesion: 0.39
Nodes (7): PREF_MAP, add(), FORM_CODE_TO_BUCKET, normalisePreferences(), parseServiceDurationToMonths(), scoreExam(), resolveTradeTracks()

### Community 57 - "src/lib/contentEngineProcessor.js (9)"
Cohesion: 0.39
Nodes (7): jszip, convertToWebP(), generateResourceId(), generateSimpleHash(), makeThumbnail(), parseRelationships(), processDocxFile()

### Community 58 - "src/pages/admin (9)"
Cohesion: 0.39
Nodes (7): IntroManualTile(), isResourceLockedForUser(), getSubjectByKey(), abbreviate(), ExamThumbnail(), LEVEL_BADGE, ExamSyllabus()

### Community 59 - "sql/rewards_system.sql (8)"
Cohesion: 0.43
Nodes (6): redeem_reward(), reward_redemptions, reward_redemptions_status_idx, reward_redemptions_user_id_idx, rewards, update_redemption_status()

### Community 60 - "src/lib/resourceMetadata.js (8)"
Cohesion: 0.36
Nodes (6): extractEmbeddedMetadata(), firstElement(), readXml(), REGIONS, RESOURCE_TYPES, textOf()

### Community 61 - "src/pages/admin (8)"
Cohesion: 0.43
Nodes (7): arrayBufferToBase64(), callSaveResource(), CATEGORIES, formatBytes(), LEVELS, PublishContentPage(), uploadDocxToTemp()

### Community 62 - "misc (7)"
Cohesion: 0.29
Nodes (5): @tailwindcss/vite, vite, @vitejs/plugin-react, API_REWRITES, __dirname

### Community 63 - "src/components/admin (6)"
Cohesion: 0.33
Nodes (4): react-quill-new, compactModules, formats, fullModules

### Community 64 - "sql/points_system.sql (6)"
Cohesion: 0.40
Nodes (3): award_points(), point_transactions, point_transactions_user_id_idx

### Community 65 - "misc (5)"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, preview

### Community 66 - "src/components/PremiumSelect.jsx (5)"
Cohesion: 0.50
Nodes (4): react-select, customStyles, DropdownIndicator(), PremiumSelect()

### Community 67 - "sql/ps_recruiter_requests_create_and_migrate.sql (5)"
Cohesion: 0.70
Nodes (4): ps_recruiter_requests, ps_recruiter_requests_employer_id_idx, ps_recruiter_requests_status_idx, ps_recruiter_requests_user_id_idx

### Community 68 - "misc (5)"
Cohesion: 0.40
Nodes (4): maxDuration, functions, api/**/*.js, rewrites

## Knowledge Gaps
- **18 isolated node(s):** `@google/generative-ai`, `docx`, `dotenv`, `html-to-docx`, `marked` (+13 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 546 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **41 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@supabase/supabase-js` connect `api/admin/misc.js (56)` to `api/admin/save-resource.js (118)`, `api/private-sector/router.js (56)`, `api/points/actions.js (14)`, `misc (29)`, `src/pages/admin (25)`, `backend/engine (22)`?**
  _High betweenness centrality (0.191) - this node is a cross-community bridge._
- **What connects `@google/generative-ai`, `docx`, `dotenv` to the rest of the system?**
  _18 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `api/admin/save-resource.js (118)` be split into smaller, more focused modules?**
  _Cohesion score 0.053744748660002895 - nodes in this community are weakly interconnected._
- **Why does `react` connect `src/lib/useSeo.js (15)` to `src/components/admin (65)`, `src/lib/bannerStore.js (59)`, `src/components/finance (47)`, `src/pages/admin (44)`, `src/lib/privateSectorTaxonomy.js (40)`, `src/pages/admin (38)`, `src/components/book (37)`, `src/components/ui (36)`, `src/components/book (35)`, `src/pages/Profiling.jsx (34)`, `src/pages/admin (32)`, `misc (29)`, `src/pages/admin (28)`, `src/pages/admin (27)`, `src/components/CategoryExplorerPortal.jsx (26)`, `src/components/ui (25)`, `src/components/book (25)`, `src/pages/admin (25)`, `src/components/quiz (23)`, `src/components/JobBoard.jsx (23)`, `src/hooks/useExamContent.js (22)`, `src/lib/legalAidCellConfig.js (22)`, `src/lib/subscriptionAccess.js (20)`, `src/lib/jobMatcher.js (20)`, `src/pages/LearningCenter.jsx (18)`, `src/components/book (17)`, `src/lib/thumbnailStore.js (15)`, `src/pages/admin (14)`, `src/pages/ProfilingTester.jsx (13)`, `src/pages/StudyMaterialsPage.jsx (13)`, `src/components/admin (12)`, `src/components/ExamContentPreview.jsx (12)`, `src/components/book (12)`, `src/pages/admin (11)`, `src/components/AiChatbotWidget.jsx (11)`, `src/pages/CVBuilder.jsx (11)`, `src/pages/admin (9)`, `src/pages/admin (8)`, `src/components/admin (6)`, `src/components/PremiumSelect.jsx (5)`, `src/lib/useInlineUnlock.js (3)`?**
  _High betweenness centrality (0.168) - this node is a cross-community bridge._
- **Should `src/components/admin (65)` be split into smaller, more focused modules?**
  _Cohesion score 0.052403846153846155 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `src/components/ui (36)` to `src/components/admin (65)`, `src/lib/bannerStore.js (59)`, `src/components/finance (47)`, `src/pages/admin (44)`, `src/lib/privateSectorTaxonomy.js (40)`, `src/pages/admin (38)`, `src/components/book (37)`, `src/components/book (35)`, `src/pages/Profiling.jsx (34)`, `src/pages/admin (32)`, `misc (29)`, `src/pages/admin (28)`, `src/pages/admin (27)`, `src/components/CategoryExplorerPortal.jsx (26)`, `src/components/ui (25)`, `src/components/book (25)`, `src/pages/admin (25)`, `src/components/quiz (23)`, `src/components/JobBoard.jsx (23)`, `src/hooks/useExamContent.js (22)`, `src/lib/subscriptionAccess.js (20)`, `src/lib/jobMatcher.js (20)`, `src/pages/LearningCenter.jsx (18)`, `src/components/book (17)`, `src/lib/useSeo.js (15)`, `src/lib/thumbnailStore.js (15)`, `src/pages/admin (14)`, `src/pages/ProfilingTester.jsx (13)`, `src/pages/StudyMaterialsPage.jsx (13)`, `src/components/admin (12)`, `src/components/ExamContentPreview.jsx (12)`, `src/components/book (12)`, `src/pages/admin (11)`, `src/components/AiChatbotWidget.jsx (11)`, `src/pages/CVBuilder.jsx (11)`, `src/pages/admin (9)`, `src/pages/admin (8)`, `src/components/PremiumSelect.jsx (5)`?**
  _High betweenness centrality (0.133) - this node is a cross-community bridge._
- **Should `sql/learning_center_schema.sql (64)` be split into smaller, more focused modules?**
  _Cohesion score 0.05406746031746032 - nodes in this community are weakly interconnected._