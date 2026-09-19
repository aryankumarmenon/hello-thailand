import { Header } from "../ui/components/Header";

export default function Home() {
  return (
    <>
      <Header />
      <main style={{ padding: "var(--ht-space-8) var(--ht-space-6)" }}>
        <h1>Hello Thailand</h1>
        <p>A verified Thailand trip planner. Coming soon.</p>
      </main>
    </>
  );
}
