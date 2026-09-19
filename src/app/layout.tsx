import type { Metadata } from "next";

import { fontVariables } from "../ui/fonts";
import "../ui/tokens.css";

export const metadata: Metadata = {
  title: "Hello Thailand",
  description: "A verified Thailand trip planner.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
