import { Link, Navigate } from 'react-router-dom';
import { useAccountSummary } from '../lib/useAccountSummary';
import { ArrowRight, HeartHandshake } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SectionBanner from './SectionBanner';
import { V2_SECTIONS } from './sections';
import { useSeo } from '../lib/useSeo';

/** The universal landing page: pick a section. Dashboard lives behind the avatar. */
export default function UniversalLanding() {
  useSeo({ noindex: true });
  const { t } = useTranslation();
  const { isEmployer, loading } = useAccountSummary();
  // Employers have their own home.
  if (!loading && isEmployer) return <Navigate to="/employer/dashboard" replace />;
  return (
    <>
      <SectionBanner
        title="Welcome to VeerNXT"
        subtitle="From Service to a Prosperous Tomorrow — choose where you want to go."
        color="#1F3A2E"
      />
      <div className="v2-container">
        <div className="v2-section-grid">
          {V2_SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <Link key={s.key} to={s.to} className="v2-section-tile" style={{ background: s.color }}>
                <span className="v2-section-tile-icon"><Icon size={34} /></span>
                <h2>{s.label}</h2>
                <p>{s.blurb}</p>
                <span className="v2-section-tile-cta">Open {s.label} <ArrowRight size={16} /></span>
              </Link>
            );
          })}
        </div>

        {/* Same copy and stats as the marketing page ("What is VeerNXT?"), from the shared translations. */}
        <section className="v2-about" aria-labelledby="v2-about-title">
          <span className="v2-eyebrow">{t('landing.whatIs.badge')}</span>
          <h2 id="v2-about-title">
            {t('landing.whatIs.title_1')} <span>{t('landing.whatIs.title_2')}</span>
          </h2>
          <p>{t('landing.whatIs.desc')}</p>
          <dl className="v2-stats">
            {[1, 2, 3].map((n) => (
              <div key={n} className="v2-stat">
                <dt>{t(`landing.whatIs.stat_${n}_val`)}</dt>
                <dd>{t(`landing.whatIs.stat_${n}_label`)}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* PLACEHOLDER copy: replace with the foundation's approved text. */}
        <section className="v2-foundation" aria-labelledby="v2-foundation-title">
          <span className="v2-foundation-icon"><HeartHandshake size={30} /></span>
          <div>
            <span className="v2-eyebrow">Our Foundation</span>
            <h2 id="v2-foundation-title">Antogattva Foundation</h2>
            <p>
              Antogattva Foundation is the non-profit arm behind VeerNXT. It works with ex-servicemen,
              veterans and their families on skilling, mentorship, welfare support and access to
              legal and financial guidance, so that the discipline built in uniform carries into
              a secure and dignified civilian life.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
