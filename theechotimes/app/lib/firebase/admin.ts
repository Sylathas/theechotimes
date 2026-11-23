// Save as: app/lib/firebase/admin.ts
// Server-only access to Firestore. Only the API routes import this, never a component.
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const app = getApps()[0] ?? initializeApp({
    credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // The key is stored on one line in .env.local, so turn the \n markers back into line breaks
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
});

export const adminDb = getFirestore(app);

// The same collection your shopProducts function reads from
export const PRODUCTS_COLLECTION = "products";