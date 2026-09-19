import { Inter, Space_Grotesk } from "next/font/google";

/**
 * Two families (docs/PLAN.md -> Design): Space Grotesk for headings, Inter for body.
 *
 * `subsets: ["latin"]` and the two weights each keep the font payload inside the 80 KB
 * budget; next/font self-hosts and serves woff2, so there is no request to Google at
 * runtime and no layout shift. Each exposes a CSS variable that ui/tokens.css reads.
 */
export const heading = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-heading",
  display: "swap",
});

export const body = Inter({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-body",
  display: "swap",
});

/** Put on <html> so both variables are in scope for tokens.css. */
export const fontVariables = `${heading.variable} ${body.variable}`;
