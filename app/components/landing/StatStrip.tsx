import styles from "./StatStrip.module.css";

const STATS = [
  "$1,000+ typical professional edit",
  "$59 every report, one book, 60 days",
  "Minutes, not months of waiting.",
];

export function StatStrip() {
  return (
    <section className={styles.section} data-section="stat-strip">
      <div className={styles.strip}>
        {STATS.map((text) => (
          <div key={text} className={styles.card}>
            <p className={styles.cardText}>{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
