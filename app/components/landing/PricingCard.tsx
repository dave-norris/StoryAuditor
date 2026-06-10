import styles from "./PricingCard.module.css";

interface PricingCardProps {
  name: string;
  price: string;
  priceLabel?: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  badge?: string;
  highlighted?: boolean;
}

export function PricingCard({
  name,
  price,
  priceLabel,
  features,
  ctaLabel,
  ctaHref,
  badge,
  highlighted,
}: PricingCardProps) {
  return (
    <article
      className={`${styles.card} ${highlighted ? styles.highlighted : ""}`}
    >
      {badge && <span className={styles.badge}>{badge}</span>}
      <h3 className={styles.name}>{name}</h3>
      <div className={styles.priceBlock}>
        <span className={styles.price}>{price}</span>
        {priceLabel && <span className={styles.priceLabel}>{priceLabel}</span>}
      </div>
      <ul className={styles.features}>
        {features.map((feature) => (
          <li key={feature} className={styles.feature}>
            {feature}
          </li>
        ))}
      </ul>
      <a href={ctaHref} className={styles.cta}>
        {ctaLabel}
      </a>
    </article>
  );
}
