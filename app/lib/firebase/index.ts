import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, getDocs, collection, updateDoc, doc, arrayUnion, arrayRemove, orderBy, query } from "firebase/firestore"

const firebaseConfig = {
    apiKey: "AIzaSyAfkx7lJjvBNseh2VP1_u2fZ2fQ-tef4GE",
    authDomain: "theechotimes-71ddb.firebaseapp.com",
    projectId: "theechotimes-71ddb",
    storageBucket: "theechotimes-71ddb.firebasestorage.app",
    messagingSenderId: "471855613861",
    appId: "1:471855613861:web:57fe20deec675ebe668a4c"
};

const firestoreApp = getApps().length
    ? getApp()
    : initializeApp(firebaseConfig);

const auth = getAuth(firestoreApp);
const db = getFirestore(firestoreApp);

export const ZineData = async () => {
    const snapshot = await getDocs(collection(db, "zines"));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getZine = async (zine: any) => {
    const snapshot = await getDocs(query(
        collection(db, "zines", zine.id, "articles"),
        orderBy("order")
    ));
    const articles = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return articles;
};

export const getArticle = async (zine: any, article: any) => {
    const snapshot = await getDocs(query(collection(db, "zines", zine.id, "articles", article.id, "versions"), orderBy("created")));
    const versions = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return versions;
};

export const getModification = async (zine: any, article: any, modification: any) => {
    const snapshot = await getDocs(query(
        collection(db, "zines", zine.id, "articles", article.id, "versions", modification.id, "modifications"),
        orderBy("created")
    ));
    const modifications = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return modifications;
};

export const shopProducts = async () => {
    const snapshot = await getDocs(collection(db, "products"));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

type CodeEntry = { code: string; utilised: boolean };
type ZineCodeDoc = { id: string; codes?: Record<string, CodeEntry> };

export const zineCodes = async () => {
    const snapshot = await getDocs(collection(db, "zinecodes"));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as ZineCodeDoc);
};

export const addComment = async (ids: { zine: any; article: any; version: any; modification: any }, comment: object) => {
    const ref = doc(db, "zines", ids.zine, "articles", ids.article, "versions", ids.version, "modifications", ids.modification);
    await updateDoc(ref, { comments: arrayUnion(comment) });
};

export const removeComment = async (ids: { zine: any; article: any; version: any; modification: any }, comment: object) => {
    const ref = doc(db, "zines", ids.zine, "articles", ids.article, "versions", ids.version, "modifications", ids.modification);
    await updateDoc(ref, { comments: arrayRemove(comment) });
};

export { auth, db };