import styles from "./HowItWorks.module.css";

const STEPS = [
  { number: 1, title: "Upload", subtitle: "Drag in your .docx manuscript." },
  { number: 2, title: "Review", subtitle: "Flags highlighted right in your text." },
  { number: 3, title: "Fix in Word", subtitle: "Download editor-style margin comments." },
  { number: 4, title: "Re-run", subtitle: "Watch your scores climb each pass." },
];

export function HowItWorks() {
  return (
    <section data-section="how-it-works" className={styles.section}>
      <h2 className={styles.heading}>How it works</h2>
      <ol className={styles.steps}>
        {STEPS.map((step) => (
          <li key={step.number} className={styles.step}>
            <h3 className={styles.stepHeading}>
              {step.number} &middot; {step.title}
            </h3>
            <p className={styles.subtitle}>{step.subtitle}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
