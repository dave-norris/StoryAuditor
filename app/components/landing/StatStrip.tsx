import styles from "./StatStrip.module.css";

const STATS = [
  { value: "$1,000+", label: "typical professional edit" },
  { value: "$59", label: "every report, one book, 60 days" },
  { value: "Minutes", label: "not months of waiting" },
];

export function StatStrip() {
  return (
    <section className={styles.section} data-section="stat-strip">
      <div className={styles.strip}>
        {STATS.map((stat) => (
          <div key={stat.value} className={styles.card}>
            <p className={styles.value}>{stat.value}</p>
            <p className={styles.label}>{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
