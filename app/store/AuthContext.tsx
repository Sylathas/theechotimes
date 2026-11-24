import { auth, db } from '../lib/firebase/index';
import { IAuth } from '../interfaces/interfaces';
import React, { useState, useEffect, createContext } from 'react';
import { LoginFormValues, UserFormValues, UserProfile } from '../interfaces/interfaces';
import { User, onAuthStateChanged } from 'firebase/auth';
import { firebaseSignUp, firebaseSignIn, firebaseSignOut, redeemZineCode } from '../lib/firebase/AuthService';
import { onSnapshot, doc } from 'firebase/firestore';

export const AuthContext = createContext<IAuth>({
    user: auth.currentUser,
    profile: null,
    loading: false,
    signIn: () => { },
    signUp: () => { },
    signOut: () => { },
    redeemCode: () => { }
});

const AuthProvider = ({ children }: { children: React.ReactNode }) => {

    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
    const [profile, setProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        let unsubProfile: (() => void) | undefined;
        const unsubAuth = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            unsubProfile?.();
            if (!user) {
                setProfile(null);
                setIsAuthLoading(false);
                return;
            }
            unsubProfile = onSnapshot(doc(db, "users", user.uid), (snap) => {
                setProfile((snap.data() as UserProfile) ?? null);
                setIsAuthLoading(false);
            });
        });
        return () => {
            unsubAuth();
            unsubProfile?.();
        };
    }, []);

    //Sign up
    const signUp = async (creds: UserFormValues) => {
        setIsLoading(true);
        try {
            const { user } = await firebaseSignUp(creds);
            setCurrentUser(user);
        } finally {
            setIsLoading(false);
        }
    }

    //Sign in
    const signIn = async (creds: LoginFormValues) => {
        setIsLoading(true);
        try {
            const { user } = await firebaseSignIn(creds);
            setCurrentUser(user);
        } finally {
            setIsLoading(false);
        }
    };

    //Sign out
    const signOut = async () => {
        setIsLoading(true);
        try {
            await firebaseSignOut();
            setCurrentUser(null);
        } finally {
            setIsLoading(false);
        }
    }

    const redeemCode = async (zineCode: string) => {
        if (!currentUser) throw new Error("You need to be logged in to redeem a code.");
        await redeemZineCode(zineCode);
    };

    //create Auth Values
    const authValues: IAuth = {
        user: currentUser,
        profile,
        loading: isLoading,
        signIn,
        signUp,
        signOut,
        redeemCode
    }

    return (
        <AuthContext.Provider value={authValues} > {children} </AuthContext.Provider>
    );
};

export default AuthProvider;