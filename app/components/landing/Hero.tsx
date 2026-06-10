import { SampleReportCard } from './SampleReportCard';
import styles from './Hero.module.css';

export function Hero() {
  return (
    <section className={styles.hero} data-section="hero">
      <div className={styles.container}>
        <div className={styles.textColumn}>
          <span className={styles.badge}>For indie authors of romance, fantasy &amp; beyond</span>

          <h1 className={styles.headline}>
            Find out if your novel is unputdownable — before your readers do
          </h1>

          <p className={styles.subheadline}>
            StoryAuditor reads your manuscript like an editor: hook strength, chapter-ending pull, pacing dips, and the line-level polish that gets you Vellum-ready.
          </p>

          <div className={styles.ctaRow}>
            <a href="/analyze" className={styles.primaryCta}>
              Analyze my first chapter — free
            </a>
            <a href="/sample" className={styles.secondaryCta}>
              See a sample report
            </a>
          </div>

          <p className={styles.reassurance}>
            No credit card. Upload a .docx, get your report in minutes.
          </p>
        </div>

        <div className={styles.cardColumn}>
          <SampleReportCard />
        </div>
      </div>
    </section>
  );
}
