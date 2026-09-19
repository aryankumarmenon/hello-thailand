import styles from "./NumberBadge.module.css";

export type NumberBadgeProps = {
  /** The rank, pin number or listicle number this badge shows. */
  value: number;
  /**
   * `accent` is the red badge used for map pins and list ranks. `muted` is the navy one,
   * for a number that should not compete with the content around it.
   *
   * Red on navy measures 1.81:1, so these two never nest: a muted badge inside an accent
   * surface, or the reverse, would be unreadable. See ui/tokens.css.
   */
  tone?: "accent" | "muted";
  /**
   * What the number means, for a screen reader. The digit alone says nothing: "3" could be
   * a rank, a stop or a step.
   */
  label: string;
};

/** One number, drawn the same way as a map pin, a list rank and a listicle step (PLAN.md). */
export function NumberBadge({ value, tone = "accent", label }: NumberBadgeProps) {
  const className = tone === "muted" ? `${styles.badge} ${styles.muted}` : styles.badge;
  return (
    <span className={className}>
      <span aria-hidden="true">{value}</span>
      <span className="ht-visually-hidden">{label}</span>
    </span>
  );
}
