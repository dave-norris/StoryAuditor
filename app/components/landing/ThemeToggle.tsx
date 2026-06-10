"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import styles from "./ThemeToggle.module.css";

type ThemeState = "light" | "system" | "dark";

const STATES: ThemeState[] = ["light", "system", "dark"];

const LABELS: Record<ThemeState, string> = {
  light: "Light theme",
  system: "System theme",
  dark: "Dark theme",
};

const ICONS: Record<ThemeState, string> = {
  light: "☀️",
  system: "💻",
  dark: "🌙",
};

function resolveState(theme: string | undefined): ThemeState {
  if (theme === "paper") return "light";
  if (theme === "night") return "dark";
  return "system";
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentState = resolveState(theme);

  function handleSelect(state: ThemeState) {
    switch (state) {
      case "light":
        setTheme("paper");
        break;
      case "dark":
        setTheme("night");
        break;
      case "system":
        setTheme("system");
        break;
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, state: ThemeState) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSelect(state);
    }
  }

  // Avoid hydration mismatch — render placeholder until mounted
  if (!mounted) {
    return (
      <div className={styles.toggle} role="group" aria-label="Theme switcher">
        {STATES.map((state) => (
          <button
            key={state}
            className={styles.option}
            type="button"
            aria-label={LABELS[state]}
            tabIndex={0}
          >
            {ICONS[state]}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.toggle} role="group" aria-label="Theme switcher">
      {STATES.map((state) => {
        const isActive = state === currentState;
        return (
          <button
            key={state}
            className={`${styles.option} ${isActive ? styles.active : ""}`}
            type="button"
            aria-label={`${LABELS[state]}${isActive ? " (active)" : ""}`}
            aria-pressed={isActive}
            onClick={() => handleSelect(state)}
            onKeyDown={(e) => handleKeyDown(e, state)}
            tabIndex={0}
          >
            {ICONS[state]}
          </button>
        );
      })}
    </div>
  );
}
