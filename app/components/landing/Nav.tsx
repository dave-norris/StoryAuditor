import { BookOpen } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { MobileMenu } from "./MobileMenu";
import styles from "./Nav.module.css";

export function Nav() {
  return (
    <header className={styles.header} data-section="nav">
      <nav className={styles.nav} aria-label="Main navigation">
        <a href="/" className={styles.brand}>
          <BookOpen size={20} aria-hidden="true" />
          StoryAuditor
        </a>

        {/* Desktop links — hidden below 768px */}
        <div className={styles.desktopLinks}>
          <a href="#feature-grid" className={styles.anchor}>
            Features
          </a>
          <a href="#pricing-tiers" className={styles.anchor}>
            Pricing
          </a>
          <a href="#sample" className={styles.anchor}>
            Sample report
          </a>
        </div>

        <div className={styles.actions}>
          {/* Open App — desktop only */}
          <a href="/app" className={styles.signIn}>
            Open App
          </a>

          {/* Sign in — desktop only */}
          <a href="/login" className={styles.signIn}>
            Sign in
          </a>

          <ThemeToggle />

          <a href="/analyze" className={styles.tryFree}>
            Try free
          </a>

          {/* Mobile hamburger menu */}
          <MobileMenu />
        </div>
      </nav>
    </header>
  );
}
