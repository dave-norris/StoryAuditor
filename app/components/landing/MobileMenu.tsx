"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import styles from "./MobileMenu.module.css";

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles.container}>
      <button
        className={styles.hamburger}
        type="button"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
      </button>

      {isOpen && (
        <div className={styles.panel} role="navigation" aria-label="Mobile navigation">
          <a
            href="#feature-grid"
            className={styles.link}
            onClick={() => setIsOpen(false)}
          >
            Features
          </a>
          <a
            href="#pricing-tiers"
            className={styles.link}
            onClick={() => setIsOpen(false)}
          >
            Pricing
          </a>
          <a
            href="#sample"
            className={styles.link}
            onClick={() => setIsOpen(false)}
          >
            Sample report
          </a>
          <a
            href="/login"
            className={styles.link}
            onClick={() => setIsOpen(false)}
          >
            Sign in
          </a>
        </div>
      )}
    </div>
  );
}
