import { z } from "zod";

/**
 * A cost in Thai baht (docs/CONTEXT.md).
 *
 * ADR 0002: a price is either verified — a number that carries the source it came
 * from and the date it was checked — or explicitly unverified. Both branches are
 * strict objects, so a verified price cannot smuggle in a `status` key and an
 * unverified one cannot carry a number.
 */
/**
 * A date something was confirmed. A future date would render as fresh for as long as it
 * stays in the future, so it is refused: you cannot have checked a source tomorrow.
 */
export const CheckedOn = z.iso
  .date()
  .refine((date) => date <= new Date().toISOString().slice(0, 10), {
    message: "checkedOn cannot be in the future",
  });

/**
 * A public https URL.
 *
 * ADR 0002 promises there is no way to store a number without a source, and ADR 0003
 * forbids the private research repo as one. A bare z.url() accepts `file:///…/FACTS.md`
 * and `http://localhost`, which would satisfy the first promise by breaking the second.
 */
export const PublicSourceUrl = z.url().refine(
  (value) => {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      return false;
    }
    if (url.protocol !== "https:") return false;
    return !["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(url.hostname);
  },
  { message: "source must be a public https URL, not a local file or host" },
);

const VerifiedPrice = z.strictObject({
  /** Whole baht. 0 is a real value: free entry. */
  thb: z.int().nonnegative(),
  /** What the number buys, in own words. Example: "entry, adult". */
  label: z.string().min(1),
  /** ISO date (YYYY-MM-DD) the number was last confirmed against its source. */
  checkedOn: CheckedOn,
  /** Public URL the number came from. */
  source: PublicSourceUrl,
});

const UnverifiedPrice = z.strictObject({
  status: z.literal("unverified"),
});

export const Price = z.union([VerifiedPrice, UnverifiedPrice]);

export type Price = z.infer<typeof Price>;

/** The value the importer writes: no number can exist before someone sources it. */
export const UNVERIFIED_PRICE: Price = { status: "unverified" };

/** Narrows a Price to the verified branch. */
export function isVerifiedPrice(price: Price): price is z.infer<typeof VerifiedPrice> {
  return !("status" in price);
}
