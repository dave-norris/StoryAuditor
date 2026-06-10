"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Monitor, Moon } from "lucide-react";
import styles from "./ThemeToggle.module.css";

type ThemeChoice = "light" | "system" | "dark";

const CHOICES: ThemeChoice[] = ["light", "system", "dark"];

const LABELS: Record<ThemeChoice, string> = {
  light: "Light theme",
  system: "System theme",
  dark: "Dark theme",
};

const ICONS: Record<ThemeChoice, React.ComponentType<{ size?: number; color?: string }>> = {
  light: Sun,
  system: Monitor,
  dark: Moon,
};

/** Map the stored theme value back to the user's choice */
function resolveChoice(theme: string | undefined): ThemeChoice {
  if (theme === "light") return "light";
  if (theme === "dark") return "dark";
  return "system";
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentChoice = resolveChoice(theme);

  function handleSelect(choice: ThemeChoice) {
    setTheme(choice);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, choice: ThemeChoice) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSelect(choice);
    }
  }

  // Avoid hydration mismatch — render placeholder until mounted
  if (!mounted) {
    return (
      <div className={styles.toggle} role="group" aria-label="Theme switcher">
        {CHOICES.map((choice) => {
          const Icon = ICONS[choice];
          return (
            <button
              key={choice}
              className={styles.option}
              type="button"
              aria-label={LABELS[choice]}
              tabIndex={0}
            >
              <Icon size={18} color="var(--ink-muted)" />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={styles.toggle} role="group" aria-label="Theme switcher">
      {CHOICES.map((choice) => {
        const isActive = choice === currentChoice;
        const Icon = ICONS[choice];
        return (
          <button
            key={choice}
            className={`${styles.option} ${isActive ? styles.active : ""}`}
            type="button"
            aria-label={`${LABELS[choice]}${isActive ? " (active)" : ""}`}
            aria-pressed={isActive}
            onClick={() => handleSelect(choice)}
            onKeyDown={(e) => handleKeyDown(e, choice)}
            tabIndex={0}
          >
            <Icon size={18} color={isActive ? "var(--brand)" : "var(--ink-muted)"} />
          </button>
        );
      })}
    </div>
  );
}
