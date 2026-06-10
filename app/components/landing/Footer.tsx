import styles from "./Footer.module.css";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer} data-section="footer">
      <div className={styles.container}>
        <p className={styles.tagline}>
          Honest by design — we tell you what the research supports, and what it
          doesn&apos;t.
        </p>
        <p className={styles.trademark}>
          Vellum is a trademark of 180g; Atticus is a trademark of Atticus.io.
          StoryAuditor is not affiliated with or endorsed by either.
        </p>
        <p className={styles.copyright}>
          &copy; {currentYear} storyauditor.com
        </p>
      </div>
    </footer>
  );
}
