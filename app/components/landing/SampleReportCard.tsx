import styles from './SampleReportCard.module.css';

export function SampleReportCard() {
  return (
    <div className={styles.card} aria-hidden="true">
      <p className={styles.title}>Sample Hook Report</p>

      <div className={styles.scores}>
        <div className={styles.scoreRow}>
          <span className={styles.scoreLabel}>Hook strength</span>
          <span className={styles.scoreValue}>82/100</span>
        </div>
        <div className={styles.scoreRow}>
          <span className={styles.scoreLabel}>Chapter-ending pull</span>
          <span className={styles.scoreValue}>64/100</span>
        </div>
      </div>

      <div className={styles.flags}>
        <span className={styles.flagsLabel}>Line-level flags</span>
        <span className={styles.flagsValue}>38</span>
      </div>
    </div>
  );
}
