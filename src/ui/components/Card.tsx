import type { ReactNode } from "react";

import styles from "./Card.module.css";

export type CardProps = {
  children: ReactNode;
  /** `beige` sits on a white page; `surface` (the default) sits on the beige page. */
  tone?: "surface" | "beige";
  /** Adds the hover lift. Only for a card that is itself a link or a button. */
  interactive?: boolean;
};

/** The one Card (PLAN.md). Place cards, guide cards and bento tiles are all this. */
export function Card({ children, tone = "surface", interactive = false }: CardProps) {
  const classes = [styles.card];
  if (tone === "beige") classes.push(styles.beige);
  if (interactive) classes.push(styles.interactive);
  return <div className={classes.join(" ")}>{children}</div>;
}
