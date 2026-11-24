import { createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from './index';
import { UserProfile } from "../../interfaces/interfaces"

interface LoginFormValues {
    email: string;
    password: string;
}

interface UserFormValues {
    email: string;
    password: string;
    displayName: string;
    zineCode: string;
}

//required if you want to keep logged in after user exits the browser or closes tab
setPersistence(auth, browserLocalPersistence);

//Sign in functionality
export const firebaseSignIn = async ({ email, password }: LoginFormValues) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result;
};

export const firebaseSignUp = async ({
    email,
    password,
    displayName,
    zineCode,
}: UserFormValues) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName });
    // Every profile starts with all zines locked; the security rules only allow this
    const profile: UserProfile = { displayName, email, zine1: false, zine2: false };
    await setDoc(doc(db, "users", user.uid), profile);
    if (zineCode?.trim()) {
        // A wrong code shouldn't stop the account being made: they can try again from their account page
        try {
            await redeemZineCode(zineCode);
        } catch (error) {
            console.warn("Zine code not redeemed at sign-up:", error);
        }
    }
    return { user, profile };
};

//Sign out functionality
export const firebaseSignOut = async () => {
    await signOut(auth);
};

// Sends the code to the server, which checks it and unlocks the zine
export const redeemZineCode = async (zineCode: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Log in to redeem a code.");
    const res = await fetch("/api/redeem-code", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` },
        body: JSON.stringify({ code: zineCode }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "The code couldn't be checked. Try again in a moment.");
    return data.zine as string;
};