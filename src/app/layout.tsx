import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hello Thailand",
  description: "A verified Thailand trip planner for Indian travellers.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
