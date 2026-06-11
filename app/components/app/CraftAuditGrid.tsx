import type { AuditCategory } from "../../data/craftAuditData";
import { CraftAuditCard } from "./CraftAuditCard";
import styles from "./CraftAuditGrid.module.css";

interface CraftAuditGridProps {
  categories: AuditCategory[];
}

export function CraftAuditGrid({ categories }: CraftAuditGridProps) {
  return (
    <section aria-label="Craft Audit Categories">
      <div className={styles.grid}>
        {categories.map((category) => (
          <CraftAuditCard key={category.name} category={category} />
        ))}
      </div>
    </section>
  );
}
