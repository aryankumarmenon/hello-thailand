import Link from "next/link";

import styles from "./Header.module.css";

export type HeaderProps = {
  /** Links shown beside the brand. Empty until there is more than one city. */
  links?: { href: string; label: string }[];
};

/** The site header. The currency switcher joins it after the trip (PLAN.md). */
export function Header({ links = [] }: HeaderProps) {
  return (
    <header className={styles.header}>
      <Link className={styles.brand} href="/">
        Hello Thailand<span className={styles.dot}>.</span>
      </Link>
      {links.length > 0 && (
        <nav className={styles.nav}>
          {links.map((link) => (
            <Link key={link.href} className={styles.link} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
