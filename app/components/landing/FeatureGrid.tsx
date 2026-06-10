import { FeatureCard } from "./FeatureCard";
import styles from "./FeatureGrid.module.css";

const FEATURES = [
  {
    icon: "🤖",
    title: "AI beta reader",
    description:
      "Get chapter-by-chapter feedback that mirrors a professional developmental editor.",
  },
  {
    icon: "⚡",
    title: "Cliffhanger score",
    description:
      "See how each chapter ending compels readers to turn the page.",
  },
  {
    icon: "🪝",
    title: "Hook strength",
    description:
      "Measure how effectively your opening grabs and holds attention.",
  },
  {
    icon: "📈",
    title: "Pacing curve",
    description:
      "Visualize tension and momentum across your entire manuscript.",
  },
  {
    icon: "✍️",
    title: "Line-level polish",
    description:
      "Flag overused words, passive voice, and prose-level issues paragraph by paragraph.",
  },
  {
    icon: "📖",
    title: "Vellum & Atticus prep",
    description:
      "Export a clean, formatter-ready file with heading styles and scene breaks in place.",
  },
] as const;

export function FeatureGrid() {
  return (
    <section data-section="feature-grid" className={styles.section}>
      <h2 className={styles.heading}>
        Everything between &ldquo;the end&rdquo; and &ldquo;publish&rdquo;
      </h2>
      <div className={styles.grid}>
        {FEATURES.map((feature) => (
          <FeatureCard
            key={feature.title}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
          />
        ))}
      </div>
    </section>
  );
}
