// Save as: app/lib/firebase/verifyUser.ts
// Checks a Firebase login token on the server and returns the user's ID.
// This replaces firebase-admin/auth, which fails to load on Vercel.
import { createRemoteJWKSet, jwtVerify } from "jose";

// Google's public keys for Firebase login tokens. jose downloads and caches them.
const GOOGLE_KEYS = createRemoteJWKSet(
    new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

// Returns the user's ID if the token is a valid, unexpired login for this Firebase project; otherwise throws.
export async function verifyUser(token: string): Promise<string> {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    if (!projectId) throw new Error("FIREBASE_PROJECT_ID is not set");

    const { payload } = await jwtVerify(token, GOOGLE_KEYS, {
        algorithms: ["RS256"],
        issuer: `https://securetoken.google.com/${projectId}`,
        audience: projectId,
    });

    if (typeof payload.sub !== "string" || payload.sub === "") throw new Error("Token has no user");
    return payload.sub;
}