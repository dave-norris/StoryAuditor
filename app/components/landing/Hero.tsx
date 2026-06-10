import { SampleReportCard } from './SampleReportCard';
import styles from './Hero.module.css';

export function Hero(): JSX.Element {
  return (
    <section className={styles.hero} data-section="hero">
      <div className={styles.container}>
        <div className={styles.textColumn}>
          <span className={styles.badge}>For indie authors of romance, fantasy &amp; beyond</span>

          <h1 className={styles.headline}>
            Find out if your novel is unputdownable — before your readers do
          </h1>

          <p className={styles.subheadline}>
            Upload your manuscript and get an AI-powered hook report with chapter scores,
            pacing curves, and line-level polish flags — so you publish with confidence.
          </p>

          <a href="/analyze" className={styles.primaryCta}>
            Analyze my first chapter — free
          </a>

          <p className={styles.reassurance}>
            No credit card. Upload a .docx, get your report in minutes.
          </p>

          <a href="/sample" className={styles.secondaryCta}>
            See a sample report
          </a>
        </div>

        <div className={styles.cardColumn}>
          <SampleReportCard />
        </div>
      </div>
    </section>
  );
}
