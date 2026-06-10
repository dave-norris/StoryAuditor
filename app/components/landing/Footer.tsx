import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer} data-section="footer">
      <div className={styles.container}>
        <p className={styles.tagline}>
          Honest by design — we tell you what the research supports, and what it
          doesn&apos;t.
        </p>
        <p className={styles.domain}>storyauditor.com</p>
      </div>
    </footer>
  );
}
