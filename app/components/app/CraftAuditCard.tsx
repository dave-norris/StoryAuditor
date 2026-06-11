import type { AuditCategory } from "../../data/craftAuditData";
import styles from "./CraftAuditCard.module.css";

interface CraftAuditCardProps {
  category: AuditCategory;
}

export function CraftAuditCard({ category }: CraftAuditCardProps) {
  return (
    <article className={styles.card}>
      <h2 className={styles.title}>{category.name}</h2>
      <ul className={styles.list}>
        {category.items.map((item) => (
          <li key={item.name} className={styles.item}>
            {item.description ? (
              <>
                <strong className={styles.itemName}>{item.name}</strong>:{" "}
                {item.description}
              </>
            ) : (
              <strong className={styles.itemName}>{item.name}</strong>
            )}
          </li>
        ))}
      </ul>
    </article>
  );
}
