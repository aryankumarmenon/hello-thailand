"use client";

import styles from "./Chip.module.css";

export type ChipProps = {
  label: string;
  /** Drawn pressed. The caller owns the state; this component only reports a click. */
  selected?: boolean;
  /** A result count shown after the label, such as a topic's number of places. */
  count?: number;
  disabled?: boolean;
  onToggle?: () => void;
};

/**
 * A filter toggle: topics, neighbourhoods and day-planner interests all use this one.
 *
 * It is a real button with `aria-pressed`, not a styled div, so it is reachable by keyboard
 * and announces its own state.
 */
export function Chip({ label, selected = false, count, disabled = false, onToggle }: ChipProps) {
  return (
    <button
      type="button"
      className={selected ? `${styles.chip} ${styles.selected}` : styles.chip}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onToggle}
    >
      {label}
      {count !== undefined && <span className={styles.count}>{count}</span>}
    </button>
  );
}
