import { Bot, Zap, Anchor, TrendingUp, AlignLeft, FileOutput } from "lucide-react";
import { FeatureCard } from "./FeatureCard";
import styles from "./FeatureGrid.module.css";

const FEATURES = [
  {
    icon: <Bot size={24} color="var(--brand)" />,
    title: "AI beta reader",
    description:
      "Chapter-by-chapter reader reactions and put-it-down risk points.",
  },
  {
    icon: <Zap size={24} color="var(--brand)" />,
    title: "Cliffhanger score",
    description:
      "How hard each chapter ending pulls readers into the next.",
  },
  {
    icon: <Anchor size={24} color="var(--brand)" />,
    title: "Hook strength",
    description:
      "Would a browsing reader keep going past page one?",
  },
  {
    icon: <TrendingUp size={24} color="var(--brand)" />,
    title: "Pacing curve",
    description:
      "See where your story drags before reviewers tell you.",
  },
  {
    icon: <AlignLeft size={24} color="var(--brand)" />,
    title: "Line-level polish",
    description:
      "Filter words, echoes, adverbs, passive voice — unlimited runs.",
  },
  {
    icon: <FileOutput size={24} color="var(--brand)" />,
    title: "Vellum & Atticus prep",
    description:
      "One click cleans your .docx for a flawless formatter import.",
  },
];

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
