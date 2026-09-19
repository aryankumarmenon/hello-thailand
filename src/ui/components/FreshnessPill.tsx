import styles from "./FreshnessPill.module.css";

/**
 * How old a checked price is (docs/CONTEXT.md): fresh under 90 days, aging 90 to 180,
 * stale over 180, or never verified at all.
 *
 * The status is computed in `domain/freshness` and passed in. `ui/` holds presentational
 * components and takes its data as props (ADR 0001), so the date arithmetic does not live
 * here.
 */
export type Freshness = "fresh" | "aging" | "stale" | "unverified";

const LABELS: Record<Freshness, string> = {
  fresh: "Checked recently",
  aging: "Checked a while ago",
  stale: "May be out of date",
  unverified: "Not yet verified",
};

export type FreshnessPillProps = {
  status: Freshness;
  /** The `checkedOn` date, already formatted. Absent for an unverified price. */
  checkedOn?: string;
};

export function FreshnessPill({ status, checkedOn }: FreshnessPillProps) {
  return (
    <span className={`${styles.pill} ${styles[status]}`}>
      {LABELS[status]}
      {checkedOn !== undefined && <span>· {checkedOn}</span>}
    </span>
  );
}
