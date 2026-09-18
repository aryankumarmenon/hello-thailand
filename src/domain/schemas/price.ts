import { z } from "zod";

/**
 * A cost in Thai baht (docs/CONTEXT.md).
 *
 * ADR 0002: a price is either verified — a number that carries the source it came
 * from and the date it was checked — or explicitly unverified. Both branches are
 * strict objects, so a verified price cannot smuggle in a `status` key and an
 * unverified one cannot carry a number.
 */
const VerifiedPrice = z.strictObject({
  /** Whole baht. 0 is a real value: free entry. */
  thb: z.int().nonnegative(),
  /** What the number buys, in own words. Example: "entry, adult". */
  label: z.string().min(1),
  /** ISO date (YYYY-MM-DD) the number was last confirmed against its source. */
  checkedOn: z.iso.date(),
  /** Public URL the number came from. */
  source: z.url(),
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
