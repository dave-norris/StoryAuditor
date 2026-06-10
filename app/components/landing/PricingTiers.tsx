import { PricingCard } from "./PricingCard";
import styles from "./PricingTiers.module.css";

const TIERS = [
  {
    name: "Hook report",
    price: "Free",
    features: ["First chapter", "No credit card", "Never expires"],
    ctaLabel: "Analyze free",
    ctaHref: "/analyze",
  },
  {
    name: "Book pass",
    price: "$59",
    priceLabel: "one-time",
    features: [
      "One manuscript",
      "Every feature",
      "Unlimited re-runs for 60 days",
    ],
    ctaLabel: "Get started",
    ctaHref: "/signup?plan=book-pass",
    badge: "Most popular",
    highlighted: true,
  },
  {
    name: "Author plan",
    price: "$18/mo",
    features: ["Unlimited manuscripts"],
    ctaLabel: "Subscribe",
    ctaHref: "/signup?plan=author",
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
            features={[...tier.features]}
            ctaLabel={tier.ctaLabel}
            ctaHref={tier.ctaHref}
            badge={"badge" in tier ? tier.badge : undefined}
            highlighted={"highlighted" in tier ? tier.highlighted : undefined}
          />
        ))}
      </div>
    </section>
  );
}
