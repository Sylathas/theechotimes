import { User } from 'firebase/auth'; //type User import

export interface LoginFormValues {
    email: string;
    password: string;
}

export interface UserFormValues {
    email: string;
    password: string;
    displayName: string;
    zineCode: string;
}

export interface IAuth {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    signIn: (creds: LoginFormValues) => void;
    signUp: (creds: UserFormValues) => void;
    signOut: () => void;
    redeemCode: (zineCode: string) => void
}

export interface UserProfile {
    displayName: string;
    email: string;
    zine1: boolean;
    zine2: boolean;
}