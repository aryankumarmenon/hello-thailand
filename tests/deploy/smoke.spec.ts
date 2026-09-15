import { expect, test } from "@playwright/test";

// Smoke checks for a deployed site, run over HTTP without a browser:
//   pnpm test:deploy                                   checks production
//   PREVIEW_URL=https://<branch-url> pnpm test:deploy  also checks that the preview is protected
// Node and pnpm versions are only in the Vercel build log, which needs a Vercel login.

test("production serves the Hello Thailand page, prerendered on Vercel", async ({ request }) => {
  const response = await request.get("/");
  expect(response.status()).toBe(200);
  expect(response.headers()["server"]).toBe("Vercel");
  expect(response.headers()["x-nextjs-prerender"]).toBe("1");

  const html = await response.text();
  expect(html).toContain("<title>Hello Thailand</title>");
  expect(html).toContain('content="A verified Thailand trip planner."');
  // hello-thailand.vercel.app serves an unrelated visa agency; fail if a URL ever points there.
  expect(html).not.toContain("Visa Agency");
});

test("preview deployment redirects to Vercel login", async ({ request }) => {
  const previewUrl = process.env.PREVIEW_URL;
  test.skip(!previewUrl, "Set PREVIEW_URL to a preview branch URL to run this check");
  if (!previewUrl) return;

  const response = await request.get(previewUrl, { maxRedirects: 0 });
  const status = response.status();
  expect([302, 307, 401], `unexpected status ${status}`).toContain(status);
  if (status !== 401) {
    expect(response.headers()["location"]).toContain("vercel.com/sso-api");
  }
});
