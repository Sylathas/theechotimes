// Save as: app/api/redeem-code/route.ts
// Checks a zine code on the server, marks it as used and unlocks the zine on the user's profile.
import { getAdminAuth, getAdminDb } from "../../lib/firebase/admin";

const ZINES = ["zine1", "zine2"]; // document IDs in the zinecodes collection, matching the profile fields

type CodeEntry = { code: string; utilised: boolean; usedBy?: string };

export async function POST(req: Request) {
    // Work out who is asking from their Firebase login, never from the request body
    const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
    let uid: string;
    try {
        uid = (await getAdminAuth().verifyIdToken(token ?? "")).uid;
    } catch {
        return Response.json({ error: "Log in to redeem a code." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const code = typeof body.code === "string" ? body.code.trim() : "";
    if (!code || code.length > 100) return Response.json({ error: "Enter a zine code." }, { status: 400 });

    const db = getAdminDb();
    const userRef = db.collection("users").doc(uid);

    // A transaction, so two people can't use the same code at the same moment
    const result = await db.runTransaction(async (tx) => {
        const refs = ZINES.map((id) => db.collection("zinecodes").doc(id));
        const [userSnap, ...codeSnaps] = await tx.getAll(userRef, ...refs);

        for (const [index, snap] of codeSnaps.entries()) {
            const codes = snap.data()?.codes as CodeEntry[] | Record<string, CodeEntry> | undefined;
            if (!codes) continue;

            const entries = Object.entries(codes) as [string, CodeEntry][];
            const match = entries.find(([, entry]) => entry?.code === code && !entry.utilised);
            if (!match) continue;

            const zineId = ZINES[index];
            if (userSnap.data()?.[zineId] === true) return { error: "You've already unlocked this zine. Keep the code for someone else." };

            // Rewrites the whole codes field, which works whether it's stored as a list or a map
            const [key, entry] = match;
            const used = { ...entry, utilised: true, usedBy: uid };
            const updated = Array.isArray(codes)
                ? codes.map((e, i) => (String(i) === key ? used : e))
                : { ...codes, [key]: used };

            tx.update(refs[index], { codes: updated });
            tx.set(userRef, { [zineId]: true }, { merge: true });
            return { zine: zineId };
        }
        return { error: "This code isn't valid, or it has already been used." };
    });

    if ("error" in result) return Response.json({ error: result.error }, { status: 400 });
    return Response.json(result);
}