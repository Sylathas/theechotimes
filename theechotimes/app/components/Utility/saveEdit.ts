import { collection, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "../../lib/firebase";

interface EditIds {
    zine: string;
    article: string;
    version: string;
}

export const saveEdit = async (
    ids: EditIds,
    version: { authorUid?: string },
    text: string,
    uid: string,
    displayName: string,
    bibliography: any[] | undefined
) => {
    const versionsPath = ["zines", ids.zine, "articles", ids.article, "versions"] as const;
    const isOwner = version.authorUid === uid;
    const batch = writeBatch(db);

    let versionRef = doc(db, ...versionsPath, ids.version);
    if (!isOwner) {
        versionRef = doc(collection(db, ...versionsPath));
        batch.set(versionRef, {
            author: displayName,
            authorUid: uid,
            basedOn: ids.version,
            created: serverTimestamp(),
        });
    }

    const modificationRef = doc(collection(versionRef, "modifications"));
    batch.set(modificationRef, {
        text,
        authorUid: uid,
        comments: [],
        created: serverTimestamp(),
        bibliography: bibliography ?? []
    });

    await batch.commit();
    return { createdVersion: !isOwner, versionId: versionRef.id, modificationId: modificationRef.id };
};