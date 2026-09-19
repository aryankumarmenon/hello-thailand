import Link from "next/link";
import type { ReactNode } from "react";

import styles from "./Button.module.css";

export type ButtonProps = {
  children: ReactNode;
  /**
   * `primary` is the red call to action, `secondary` the navy one, `quiet` an outline.
   * There is no red-on-navy pairing, because that combination measures 1.81:1.
   */
  variant?: "primary" | "secondary" | "quiet";
  /**
   * Renders a link instead of a button. Use for navigation, not for an action.
   * Internal routes only: an outbound link belongs in prose, with its own rel attributes.
   */
  href?: string;
  disabled?: boolean;
  onClick?: () => void;
};

/** The one Button (PLAN.md). */
export function Button({
  children,
  variant = "primary",
  href,
  disabled = false,
  onClick,
}: ButtonProps) {
  const className = `${styles.button} ${styles[variant]}`;
  if (href !== undefined) {
    return (
      <Link className={className} href={href}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={className} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}
