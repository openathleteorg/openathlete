/**
 * Creates or updates the Stripe products and prices of the offers on sale,
 * with stable lookup keys the API finds them by (supporter_800_month...).
 * Idempotent: run it again after a change of the offers table.
 *
 * Prices are VAT included (tax_behavior: inclusive). A price's amount
 * cannot change in Stripe: when it differs, a new price takes the lookup
 * key over (transfer_lookup_key) and the old one is archived. Existing
 * subscriptions keep their price, founders' included.
 *
 * Run it yourself, in test mode first:
 *
 *   pnpm shared build
 *   STRIPE_SECRET_KEY=sk_test_... node scripts/stripe/setup-pricing-v2.ts
 *   STRIPE_SECRET_KEY=sk_test_... node scripts/stripe/setup-pricing-v2.ts --apply
 *
 * Without --apply it only says what it would do. Node 22.18 or later runs
 * the TypeScript as is.
 */
import { createRequire } from "node:module";
import { join } from "node:path";

// Stripe and the offers table are dependencies of the API
const require = createRequire(
  join(import.meta.dirname, "../../apps/api/package.json"),
);
const Stripe = require("stripe");
const shared = require("@openathlete/shared");

interface PriceSpec {
  lookupKey: string;
  interval: "month" | "year";
  amountCents: number;
}

interface ProductSpec {
  /** metadata.openathlete_offer, how the script finds the product again */
  offer: string;
  name: string;
  description: string;
  prices: PriceSpec[];
}

const PRODUCTS: ProductSpec[] = [
  {
    offer: shared.Offer.SUPPORTER,
    name: "OpenAthlete Supporter",
    description:
      "Funds an open-source training platform. Includes AI on the instance keys, within a weekly allowance.",
    prices: shared.supporterStripePrices(),
  },
];

const apply = process.argv.includes("--apply");
const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.error("Set STRIPE_SECRET_KEY (a test key first: sk_test_...)");
  process.exit(1);
}
const stripe = new Stripe(secretKey, { apiVersion: "2025-11-17.clover" });
const mode = secretKey.startsWith("sk_live_") ? "LIVE" : "test";

const done: string[] = [];
const say = (line: string) => {
  done.push(line);
  console.log(`${apply ? "" : "[dry run] "}${line}`);
};

async function findProduct(offer: string) {
  const found = await stripe.products.search({
    query: `metadata['openathlete_offer']:'${offer}'`,
  });
  return found.data[0] ?? null;
}

async function setUpProduct(spec: ProductSpec) {
  let product = await findProduct(spec.offer);
  if (!product) {
    say(`create product "${spec.name}"`);
    if (apply) {
      product = await stripe.products.create({
        name: spec.name,
        description: spec.description,
        tax_code: "txcd_10103001", // Software as a service, business use
        metadata: { openathlete_offer: spec.offer },
      });
    }
  } else if (
    product.name !== spec.name ||
    product.description !== spec.description ||
    !product.active
  ) {
    say(`update product "${spec.name}" (${product.id})`);
    if (apply) {
      product = await stripe.products.update(product.id, {
        name: spec.name,
        description: spec.description,
        active: true,
      });
    }
  } else {
    console.log(`product "${spec.name}" is up to date (${product.id})`);
  }

  const existing = await stripe.prices.list({
    lookup_keys: spec.prices.map((price) => price.lookupKey),
    limit: 100,
  });
  for (const price of spec.prices) {
    const current = existing.data.find(
      (item: { lookup_key: string }) => item.lookup_key === price.lookupKey,
    );
    const matches =
      current &&
      current.active &&
      current.unit_amount === price.amountCents &&
      current.currency === "eur" &&
      current.recurring?.interval === price.interval &&
      current.tax_behavior === "inclusive" &&
      current.product === product?.id;
    if (matches) {
      console.log(`price ${price.lookupKey} is up to date (${current.id})`);
      continue;
    }
    say(
      `${current ? "replace" : "create"} price ${price.lookupKey}: ${price.amountCents / 100} € a ${price.interval}, VAT included`,
    );
    if (!apply || !product) continue;
    await stripe.prices.create({
      product: product.id,
      currency: "eur",
      unit_amount: price.amountCents,
      recurring: { interval: price.interval },
      tax_behavior: "inclusive",
      lookup_key: price.lookupKey,
      transfer_lookup_key: true,
      nickname: `${spec.name}, ${price.amountCents / 100} €/${price.interval}`,
    });
    // Subscriptions on the old price keep it; new ones get the new price
    if (current?.active) {
      await stripe.prices.update(current.id, { active: false });
    }
  }
}

console.log(`Stripe account in ${mode} mode`);
for (const product of PRODUCTS) {
  await setUpProduct(product);
}
console.log(
  done.length === 0
    ? "Nothing to do."
    : apply
      ? `Done: ${done.length} change(s).`
      : `${done.length} change(s) to make: run again with --apply.`,
);
