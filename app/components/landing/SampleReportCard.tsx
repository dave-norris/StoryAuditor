import styles from './SampleReportCard.module.css';

export function SampleReportCard() {
  return (
    <div className={styles.card} aria-hidden="true">
      <p className={styles.title}>Chapter 1 report</p>

      <div className={styles.scores}>
        <div className={styles.scoreRow}>
          <span className={styles.scoreLabel}>Hook strength</span>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: '82%' }} />
          </div>
          <span className={styles.scoreValue}>82 / 100</span>
        </div>

        <div className={styles.scoreRow}>
          <span className={styles.scoreLabel}>Chapter-ending pull</span>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: '64%' }} />
          </div>
          <span className={styles.scoreValue}>64 / 100</span>
        </div>
      </div>

      <div className={styles.flags}>
        <span className={styles.flagsLabel}>38 line-level flags</span>
        <a href="#sample-report" className={styles.flagsLink}>
          View highlights &rarr;
        </a>
      </div>
    </div>
  );
}
