// Save as: app/api/checkout/route.ts
// Receives the basket, checks it against Firestore and returns the address of a Stripe payment page.
import Stripe from "stripe";
import { getAdminDb, PRODUCTS_COLLECTION } from "../../lib/firebase/admin";

const CURRENCY = "gbp";

// Shipping zones. Prices are in pence. Keep the prices in step with SHIPPING in the shop component.
const ZONES = {
    domestic: { label: "UK", price: 350, countries: ["GB"] },
    europe: { label: "Europe", price: 700, countries: ["IE", "FR", "DE", "IT", "ES", "NL", "BE", "PT", "AT", "DK", "SE", "FI", "PL", "CZ", "GR"] },
    world: { label: "Rest of the world", price: 1200, countries: ["US", "CA", "AU", "NZ", "JP", "CH", "NO"] },
} as const;

type Zone = keyof typeof ZONES;
type BasketItem = { id: string; quantity: number };

export async function POST(req: Request) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const adminDb = getAdminDb();
    const { items, zone } = (await req.json()) as { items: BasketItem[]; zone: Zone };

    const shipping = ZONES[zone];
    if (!shipping) return Response.json({ error: "Choose where to ship to." }, { status: 400 });

    const validBasket = Array.isArray(items) && items.length > 0 && items.length <= 20 &&
        items.every((i) => typeof i.id === "string" && /^[\w-]+$/.test(i.id) &&
            Number.isInteger(i.quantity) && i.quantity >= 1 && i.quantity <= 10);
    if (!validBasket) return Response.json({ error: "Your basket couldn't be read. Remove an item and try again." }, { status: 400 });

    // Names and prices come from Firestore, never from the browser
    const line_items = [];
    for (const item of items) {
        const product = (await adminDb.collection(PRODUCTS_COLLECTION).doc(item.id).get()).data();
        if (!product) {
            return Response.json({ error: "One of these items is no longer in the shop. Remove it and try again." }, { status: 400 });
        }
        // A product without a stock field is treated as unlimited
        if (typeof product.stock === "number" && product.stock < item.quantity) {
            const left = product.stock === 0 ? "it's sold out" : `only ${product.stock} left`;
            return Response.json({ error: `Not enough stock for ${product.name}: ${left}.` }, { status: 409 });
        }
        line_items.push({
            quantity: item.quantity,
            price_data: { currency: CURRENCY, unit_amount: product.price, product_data: { name: product.name } },
        });
    }

    const origin = new URL(req.url).origin;
    const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items,
        shipping_address_collection: { allowed_countries: [...shipping.countries] },
        shipping_options: [{
            shipping_rate_data: {
                type: "fixed_amount",
                display_name: `Shipping (${shipping.label})`,
                fixed_amount: { amount: shipping.price, currency: CURRENCY },
            },
        }],
        // Read back by the webhook to know what was bought
        metadata: { items: items.map((i) => `${i.id}:${i.quantity}`).join(",") },
        success_url: `${origin}/?order=success`,
        cancel_url: `${origin}/?order=cancelled`,
    });

    return Response.json({ url: session.url });
}