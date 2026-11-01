import React, { useRef, useState, useEffect, useCallback, forwardRef } from 'react';
import HTMLFlipBook from 'react-pageflip';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  BookOpen,
  Lock,
  CheckCircle,
  Crown,
  Sparkles,
  Volume2,
  VolumeX,
  FileText,
  RotateCcw
} from 'lucide-react';
import { cleanContentTitle } from '../../lib/contentTitle';
import { canAccessResource } from '../../lib/subscriptionAccess';
import { BlockRenderer } from './BlockRenderer';
import { ChapterHeader } from './BookBlocks';
import './FlipbookReader.css';

// ForwardRef Page component required by react-pageflip engine
const Page = forwardRef(({ children, className = '', number, density = 'soft' }, ref) => {
  return (
    <div className={`demoPage ${className}`} ref={ref} data-density={density}>
      <div className="page-content-wrapper">
        {children}
      </div>
    </div>
  );
});
Page.displayName = 'Page';

export default function FlipbookReader({
  resource,
  chapters = [],
  activeChapterIndex = 0,
  onChapterChange,
  onLoadChapter,
  effectiveTier = 'FREE',
  isRead = false,
  onMarkAsRead,
  onSwitchToStandard
}) {
  const flipBookRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Sound effect generator using Web Audio API (zero external assets needed)
  const playFlipSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      // Audio context policy fallback
    }
  }, [soundEnabled]);

  const handleFlip = useCallback((e) => {
    const pageIndex = e.data;
    setCurrentPage(pageIndex);
    playFlipSound();

    // Map page index to chapter index (Page 0 = Cover, Page 1+ = Chapters).
    // The table of contents lives in the sidebar now, not as a book page.
    const targetChapter = Math.max(0, pageIndex - 1);
    if (targetChapter < chapters.length && targetChapter !== activeChapterIndex) {
      if (onChapterChange) onChapterChange(targetChapter);
      if (onLoadChapter && !chapters[targetChapter]?.loaded) {
        onLoadChapter(targetChapter);
      }
    }
  }, [chapters, activeChapterIndex, onChapterChange, onLoadChapter, playFlipSound]);

  // Turn to specific page or chapter. `.pageFlip` is always a function on
  // the ref, but calling it returns undefined until react-pageflip's
  // internal engine has finished mounting, so the result itself — not just
  // the method reference — needs the null check.
  const goToPage = (pageIndex) => {
    const pageFlip = flipBookRef.current?.pageFlip?.();
    if (pageFlip) {
      pageFlip.turnToPage(pageIndex);
    }
  };

  // Keep the book in sync when the chapter is changed from outside (the
  // sidebar TOC) rather than by flipping a page directly. Skips the very
  // first render so the book still opens on its cover instead of jumping
  // straight to chapter 1.
  const skipInitialSync = useRef(true);
  useEffect(() => {
    if (skipInitialSync.current) {
      skipInitialSync.current = false;
      return;
    }
    const targetPage = activeChapterIndex + 1;
    if (targetPage !== currentPage) {
      goToPage(targetPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChapterIndex]);

  const handlePrev = () => {
    const pageFlip = flipBookRef.current?.pageFlip?.();
    if (pageFlip) pageFlip.flipPrev();
  };

  const handleNext = () => {
    const pageFlip = flipBookRef.current?.pageFlip?.();
    if (pageFlip) pageFlip.flipNext();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const totalPagesCalculated = (chapters?.length || 1) + 2; // Cover + Chapters + Back Cover

  return (
    <div className="flipbook-container">
      {/* 3D Book Stage */}
      <div className="flipbook-stage">
        <HTMLFlipBook
          ref={flipBookRef}
          width={600}
          height={785}
          size="stretch"
          minWidth={420}
          maxWidth={820}
          minHeight={550}
          maxHeight={1070}
          drawShadow={false}
          showCover={true}
          mobileScrollSupport={true}
          onFlip={handleFlip}
          className="stpageflip-wrapper"
          style={{ margin: '0 auto' }}
        >
          {/* PAGE 0: HARDCOVER FRONT */}
          <Page density="hard" className="hard-cover">
            <div className="cover-inner">
              <div>
                <div className="cover-badge">{resource?.subject || 'Guidebook'}</div>
                <h1 className="cover-title">
                  {cleanContentTitle(resource?.title || 'VeerNXT Study Guide', resource?.exam_name)}
                </h1>
                <p className="cover-subtitle">
                  {resource?.exam_name || 'Competitive Exam Preparation'}
                </p>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', opacity: 0.85, fontSize: '0.85rem' }}>
                  <Sparkles size={16} color="#5eead4" />
                  <span>Realistic 3D Edition • Interactive Reader</span>
                </div>
                <div className="cover-footer">
                  <span>VeerNXT Learning Engine</span>
                  <span>{chapters?.length || 1} Chapters</span>
                </div>
              </div>
            </div>
          </Page>

          {/* PAGES 1+: CHAPTERS — table of contents lives in the page sidebar now */}
          {(chapters || []).map((chap, idx) => {
            const chapAccess = canAccessResource(effectiveTier, resource?.category, idx);
            const isBlocks = resource?.format === 'blocks';

            return (
              <Page key={chap.id || idx} density="soft">
                <div className="page-running-header">
                  <span>{cleanContentTitle(resource?.title || '', resource?.exam_name)}</span>
                  <span>Chapter {idx + 1}</span>
                </div>

                <div className="page-body-scroll">
                  {!chapAccess.allowed ? (
                    <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
                      <div style={{
                        width: '50px', height: '50px', borderRadius: '50%', background: '#fee2e2',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem'
                      }}>
                        <Lock size={24} color="#ef4444" />
                      </div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                        Chapter Locked
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
                        {chapAccess.reason || 'Upgrade subscription to access full guidebook.'}
                      </p>
                    </div>
                  ) : !chap.loaded ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                      Loading Chapter Content...
                    </div>
                  ) : isBlocks && chap.blocks ? (
                    <div>
                      <ChapterHeader title={chap.title} order={idx + 1} />
                      <div className="bk-blocks-container" style={{ marginTop: '1rem' }}>
                        {chap.blocks.map((block) => (
                          <BlockRenderer key={block.id} block={block} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
                        {chap.title}
                      </h2>
                      <div
                        className="ql-editor"
                        dangerouslySetInnerHTML={{ __html: chap.body_html || '<p>Content preview...</p>' }}
                      />
                    </div>
                  )}
                </div>

                <div className="page-running-footer">
                  <span>{chap.title}</span>
                  <span>Page {idx + 1}</span>
                </div>
              </Page>
            );
          })}

          {/* HARDCOVER BACK / END PAGE */}
          <Page density="hard" className="hard-cover-back">
            <div className="cover-inner" style={{ textAlign: 'center', justifyContent: 'center', gap: '2rem' }}>
              <div>
                <BookOpen size={48} color="#5eead4" style={{ margin: '0 auto 1rem' }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
                  You've Reached the End
                </h2>
                <p style={{ fontSize: '0.9rem', color: '#99f6e4', maxWidth: '300px', margin: '0 auto' }}>
                  Great job completing this guidebook! Practice and revise key concepts regularly.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
                <button
                  onClick={onMarkAsRead}
                  disabled={isRead}
                  className="mode-badge-btn"
                  style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}
                >
                  <CheckCircle size={18} /> {isRead ? 'Completed' : 'Mark as Finished'}
                </button>

                <button
                  onClick={onSwitchToStandard}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#cbd5e1',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    marginTop: '0.5rem'
                  }}
                >
                  <RotateCcw size={14} /> Back to Scroll View
                </button>
              </div>
            </div>
          </Page>
        </HTMLFlipBook>
      </div>

      {/* FLOATING DESKTOP TOOLBAR */}
      <div className="flipbook-toolbar">
        <button
          onClick={handlePrev}
          className="toolbar-btn"
          title="Previous Page (Left Arrow)"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="toolbar-page-indicator">
          <span>Page {currentPage + 1}</span>
          <span style={{ opacity: 0.5 }}>/</span>
          <span>{totalPagesCalculated}</span>
        </div>

        <button
          onClick={handleNext}
          className="toolbar-btn"
          title="Next Page (Right Arrow)"
        >
          <ChevronRight size={20} />
        </button>

        <div className="toolbar-divider" />

        <button
          onClick={() => setSoundEnabled(prev => !prev)}
          className="toolbar-btn"
          title={soundEnabled ? 'Page Turn Sound Enabled' : 'Page Turn Sound Muted'}
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>

        <button
          onClick={toggleFullscreen}
          className="toolbar-btn"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>

        <div className="toolbar-divider" />

        <button
          onClick={onSwitchToStandard}
          className="mode-badge-btn"
          title="Switch back to Standard Scroll View"
        >
          <FileText size={14} /> Scroll View
        </button>
      </div>
    </div>
  );
}
