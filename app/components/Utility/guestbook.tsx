"use client";
import { useEffect, useState } from "react";
import {
    addDoc, collection, doc, getDoc, getDocs, increment,
    limit, orderBy, query, serverTimestamp, updateDoc,
} from "firebase/firestore";
import { db } from "@/app/lib/firebase";

/*-------------*/
/*---Counter---*/
/*-------------*/

const COUNT_UNIQUE_VISITORS = true;

export function VisitorCounter({ digits = 6, isMobile }: { digits?: number; isMobile?: boolean }) {
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        const ref = doc(db, "stats", "people");
        let alreadyCounted = false;
        try { alreadyCounted = COUNT_UNIQUE_VISITORS && localStorage.getItem("echoCounted") === "yes"; } catch { }

        (async () => {
            try {
                if (!alreadyCounted) {
                    await updateDoc(ref, { count: increment(1) });
                    try { localStorage.setItem("echoCounted", "yes"); } catch { }
                }
                const snap = await getDoc(ref);
                setCount(snap.data()?.count ?? null);
            } catch (error) {
                console.error("Visitor counter unavailable:", error);
            }
        })();
    }, []);

    if (count === null) return null;

    return (
        <div id="visitorCounter" className={"absolute top-[50%] left-[15%] inline-flex font-serif text-white tracking-widest " + (isMobile ? "w-[70%] h-[30%] text-[7vw]" : "w-[70%] text-[2vw]")} aria-label={`${count} visitors`}>
            {String(count).padStart(digits, "0").split("").map((d, i) => <span className={"z-5 ml-[1.75vw] " + (isMobile && "mt-[13%]")} key={i}>{d}</span>)}
            <img className="absolute w-full h-full z-4" src="./rooms/about/counterBG.png" />
        </div>
    );
}

/*---------------*/
/*---Guestbook---*/
/*---------------*/

type Entry = { id: string; name: string; message: string; created: Date | null };

const MAX_NAME = 40;
const MAX_MESSAGE = 500;

export function Guestbook() {
    const [entries, setEntries] = useState<Entry[]>([]);
    const [name, setName] = useState("");
    const [message, setMessage] = useState("");
    const [trap, setTrap] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const snap = await getDocs(query(collection(db, "guestbook"), orderBy("created", "desc"), limit(50)));
                setEntries(snap.docs.map((d) => ({
                    id: d.id,
                    name: d.data().name,
                    message: d.data().message,
                    created: d.data().created?.toDate?.() ?? null,
                })));
            } catch (err) {
                console.error("Guestbook unavailable:", err);
            }
        })();
    }, []);

    async function sign(e: React.FormEvent) {
        e.preventDefault();
        if (sending) return;
        const cleanName = name.trim();
        const cleanMessage = message.trim();
        if (!cleanName || !cleanMessage) return setError("Add your name and a message.");

        if (trap) { setName(""); setMessage(""); return; }

        setSending(true);
        setError("");
        try {
            const ref = await addDoc(collection(db, "guestbook"), {
                name: cleanName,
                message: cleanMessage,
                created: serverTimestamp(),
            });
            setEntries((list) => [{ id: ref.id, name: cleanName, message: cleanMessage, created: new Date() }, ...list]);
            setName("");
            setMessage("");
        } catch (err) {
            console.error("Couldn't sign the guestbook:", err);
            setError("Your message wasn't saved. Try again in a moment.");
        } finally {
            setSending(false);
        }
    }

    return (
        <div id="guestbook" className="absolute w-[80%] h-[60%] top-[20%] left-[10%] font-serif text-black">
            <form onSubmit={sign} className="flex flex-col gap-2 mb-6">
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={MAX_NAME}
                    placeholder="Your name"
                    className="border border-black bg-transparent p-1"
                />
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={MAX_MESSAGE}
                    rows={3}
                    placeholder="Leave a message"
                    className="border border-black bg-transparent p-1 resize-y"
                />
                <input
                    value={trap}
                    onChange={(e) => setTrap(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    className="absolute left-[-9999px]"
                    name="website"
                />
                <div className="flex justify-between items-center">
                    <span className="text-sm opacity-70">{message.length}/{MAX_MESSAGE}</span>
                    <button type="submit" disabled={sending} className="border border-black px-3 py-1 disabled:opacity-50">
                        {sending ? "Signing…" : "Sign the guestbook"}
                    </button>
                </div>
                {error && <p className="text-red-700 text-sm">{error}</p>}
            </form>

            {entries.length === 0 ? (
                <p className="italic">No messages yet. Be the first to sign!</p>
            ) : (
                <ul className="flex flex-col gap-4">
                    {entries.map((entry) => (
                        <li key={entry.id} className="border-b border-black pb-2">
                            <p className="font-bold">
                                {entry.name}
                                {entry.created && (
                                    <span className="font-normal text-sm opacity-70 ml-2">
                                        {entry.created.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                    </span>
                                )}
                            </p>
                            <p className="whitespace-pre-wrap break-words">{entry.message}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}