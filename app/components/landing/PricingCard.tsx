import styles from "./PricingCard.module.css";

interface PricingCardProps {
  name: string;
  price: string;
  priceLabel?: string;
  description: string;
  badge?: string;
  highlighted?: boolean;
}

export function PricingCard({
  name,
  price,
  priceLabel,
  description,
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
      <p className={styles.description}>{description}</p>
    </article>
  );
}
