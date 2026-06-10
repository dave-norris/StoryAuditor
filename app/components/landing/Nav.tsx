import { ThemeToggle } from "./ThemeToggle";
import styles from "./Nav.module.css";

export function Nav() {
  return (
    <header className={styles.header} data-section="nav">
      <nav className={styles.nav} aria-label="Main navigation">
        <a href="/" className={styles.brand}>
          StoryAuditor
        </a>
        <div className={styles.links}>
          <a href="#feature-grid" className={styles.anchor}>
            Features
          </a>
          <a href="#pricing-tiers" className={styles.anchor}>
            Pricing
          </a>
          <a href="#sample" className={styles.anchor}>
            Sample Report
          </a>
          <a href="/login" className={styles.signIn}>
            Sign in
          </a>
          <ThemeToggle />
          <a href="/analyze" className={styles.tryFree}>
            Try free
          </a>
        </div>
      </nav>
    </header>
  );
}
