import { PricingCard } from "./PricingCard";
import styles from "./PricingTiers.module.css";

const TIERS = [
  {
    name: "Hook report",
    price: "Free",
    description: "First chapter, no card, never expires.",
  },
  {
    name: "Book pass",
    price: "$59",
    priceLabel: "one-time",
    description:
      "One manuscript, every feature, unlimited re-runs for 60 days.",
    badge: "Most popular",
    highlighted: true,
  },
  {
    name: "Author plan",
    price: "$18/mo",
    description:
      "Unlimited manuscripts for authors who never stop writing.",
  },
] as const;

export function PricingTiers() {
  return (
    <section data-section="pricing-tiers" className={styles.section}>
      <h2 className={styles.heading}>Simple pricing, no surprises</h2>
      <div className={styles.grid}>
        {TIERS.map((tier) => (
          <PricingCard
            key={tier.name}
            name={tier.name}
            price={tier.price}
            priceLabel={"priceLabel" in tier ? tier.priceLabel : undefined}
            description={tier.description}
            badge={"badge" in tier ? tier.badge : undefined}
            highlighted={"highlighted" in tier ? tier.highlighted : undefined}
          />
        ))}
      </div>
    </section>
  );
}
