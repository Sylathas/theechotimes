// Save as: app/api/stripe-webhook/route.ts
// Stripe calls this after a payment. It saves the order and lowers the stock.
import Stripe from "stripe";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, PRODUCTS_COLLECTION } from "@/app/lib/firebase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
    // The signature proves the request came from Stripe. Checking it needs the raw, unparsed body.
    const body = await req.text();
    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(body, req.headers.get("stripe-signature") ?? "", process.env.STRIPE_WEBHOOK_SECRET!);
    } catch {
        return new Response("Invalid signature", { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status === "paid") await recordOrder(session);
    }
    return new Response("ok");
}

async function recordOrder(session: Stripe.Checkout.Session) {
    const items = (session.metadata?.items ?? "").split(",").filter(Boolean).map((entry) => {
        const [id, quantity] = entry.split(":");
        return { id, quantity: Number(quantity) };
    });
    const orderRef = adminDb.collection("orders").doc(session.id);

    await adminDb.runTransaction(async (tx) => {
        // Stripe can send the same event more than once, so each order is only counted once
        if ((await tx.get(orderRef)).exists) return;

        const refs = items.map((i) => adminDb.collection(PRODUCTS_COLLECTION).doc(i.id));
        const snaps = refs.length ? await tx.getAll(...refs) : [];
        snaps.forEach((snap, index) => {
            const stock = snap.data()?.stock;
            // Products without a stock field are left alone
            if (typeof stock === "number") {
                tx.update(refs[index], { stock: Math.max(0, stock - items[index].quantity) });
            }
        });

        tx.set(orderRef, {
            items,
            email: session.customer_details?.email ?? null,
            total: session.amount_total,
            created: FieldValue.serverTimestamp(),
        });
    });
}