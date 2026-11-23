import { createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db, zineCodes } from './index';
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
    const unlocks = await resolveZineCode({ zineCode });
    const profile: UserProfile = {
        displayName,
        email,
        zine1: unlocks.zine1,
        zine2: unlocks.zine2,
    };
    await setDoc(doc(db, "users", user.uid), profile);
    return { user, profile };
};

//Sign out functionality
export const firebaseSignOut = async () => {
    await signOut(auth);
};

export const resolveZineCode = async ({
    zineCode,
}: {
    zineCode: string;
}) => {
    const codes = await zineCodes();
    const unlocks = { zine1: false, zine2: false };
    if (!zineCode) return unlocks;
    for (const zine of codes) {
        const entries = zine.codes ?? {};
        for (const [key, entry] of Object.entries(entries)) {
            if (entry.code !== zineCode || entry.utilised) continue;
            if (zine.id === "zine1" || zine.id === "zine2") {
                unlocks[zine.id] = true;
            }
            await updateDoc(doc(db, "zinecodes", zine.id), {
                [`codes.${key}.utilised`]: true,
            });
            return unlocks;
        }
    }
    return unlocks;
};

export const redeemZineCode = async (uid: string, zineCode: string) => {
    const unlocks = await resolveZineCode({ zineCode });
    const changes = Object.fromEntries(Object.entries(unlocks).filter(([, unlocked]) => unlocked));
    if (Object.keys(changes).length === 0) throw new Error("This code is invalid or has already been used.");
    await updateDoc(doc(db, "users", uid), changes);
};