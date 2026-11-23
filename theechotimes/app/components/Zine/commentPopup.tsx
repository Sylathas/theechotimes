"use client";
import { useEffect, useRef, useState, RefObject } from "react";
import { createPortal } from "react-dom";

export interface CommentReference {
    start: number;
    end: number;
    quote: string;
    username: boolean;
}

export interface NewComment {
    comment_reference: CommentReference;
    comment_text: string;
}

export function getSelectionOffsets(container: HTMLElement): CommentReference | null {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    if (!container.contains(range.startContainer) || !container.contains(range.endContainer)) return null;

    const quote = range.toString();
    if (!quote.trim()) return null;

    const username = false;

    // Measure all the text between the start of the container and the start of the selection
    const before = document.createRange();
    before.selectNodeContents(container);
    before.setEnd(range.startContainer, range.startOffset);
    const start = before.toString().length;

    return { start, end: start + quote.length, quote, username };
}

interface Props {
    containerRef: RefObject<HTMLElement | null>;
    enabled: boolean;
    onSubmit: (comment: NewComment) => Promise<void>;
}

type Pending = CommentReference & { x: number; top: number; bottom: number };

const POPUP_WIDTH = 300;
const GAP = 8;

export default function CommentPopup({ containerRef, enabled, onSubmit }: Props) {
    const [pending, setPending] = useState<Pending | null>(null);
    const [text, setText] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [showUsername, setShowUsername] = useState(false);
    const popupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!enabled) return;

        const insidePopup = (target: EventTarget | null) =>
            !!popupRef.current && popupRef.current.contains(target as Node);

        const close = () => {
            setPending(null);
            setText("");
            setError("");
        };

        const handleSelectionEnd = (event: Event) => {
            if (insidePopup(event.target)) return;
            if (event instanceof KeyboardEvent && event.key === "Escape") return;
            setTimeout(() => {
                const container = containerRef.current;
                const reference = container ? getSelectionOffsets(container) : null;
                if (!reference) return;
                const rect = window.getSelection()!.getRangeAt(0).getBoundingClientRect();
                setPending({ ...reference, x: rect.left + rect.width / 2, top: rect.top, bottom: rect.bottom });
                setText("");
                setError("");
            }, 0);
        };

        const handlePointerDown = (event: PointerEvent) => {
            if (!insidePopup(event.target)) close();
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") close();
        };
        const handleScroll = (event: Event) => {
            if (!insidePopup(event.target)) close();
        };

        document.addEventListener("pointerup", handleSelectionEnd);
        document.addEventListener("keyup", handleSelectionEnd);
        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("scroll", handleScroll, true);
        return () => {
            document.removeEventListener("pointerup", handleSelectionEnd);
            document.removeEventListener("keyup", handleSelectionEnd);
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("scroll", handleScroll, true);
        };
    }, [enabled, containerRef]);

    const submit = async () => {
        if (!pending || !text.trim() || saving) return;
        setSaving(true);
        setError("");
        try {
            await onSubmit({
                comment_reference: { start: pending.start, end: pending.end, quote: pending.quote, username: showUsername },
                comment_text: text.trim(),
            });
            setPending(null);
            setText("");
            window.getSelection()?.removeAllRanges();
        } catch (err) {
            console.error("Couldn't save comment:", err);
            setError("Your comment wasn't saved. Check your connection and try again.");
        } finally {
            setSaving(false);
        }
    };

    const usernameClick = () => {
        if (showUsername) {
            setShowUsername(false)
        } else {
            setShowUsername(true)
        }
    }

    if (!enabled || !pending) return null;

    const half = POPUP_WIDTH / 2 + GAP;
    const left = Math.min(Math.max(pending.x, half), window.innerWidth - half);
    const placeBelow = pending.top < 200;
    const style: React.CSSProperties = {
        position: "fixed",
        left,
        width: POPUP_WIDTH,
        zIndex: 800,
        ...(placeBelow
            ? { top: pending.bottom + GAP, transform: "translateX(-20%)" }
            : { top: pending.top - GAP, transform: "translate(-20%, -100%)" }),
    };

    return createPortal(
        <div ref={popupRef} style={style} className="text-black font-serif">
            <img src='./rooms/zine/commentBubbles/commentOverlay.png' className="absolute w-full h-full image-pixelated" />
            <textarea
                className="relative w-[90%] h-25 text-sm resize-none ml-[5%] mt-[5%] outline-none vulf"
                placeholder="..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
                }}
            />
            {error && <p className="relative text-sm text-red-700 mt-1 z-801">{error}</p>}
            <div className='flex mb-[7%]'>
                <button
                    className="relative w-[42%] ml-[5%] disabled:opacity-80 authbutton"
                    onClick={submit}
                    disabled={saving || !text.trim()}
                >
                    <img src={saving ? './rooms/zine/commentBubbles/commenting.png' : "./rooms/zine/commentBubbles/addComment.png"} className="w-full h-full image-pixelated" />
                </button>
                <button
                    className="relative w-[55%] ml-[5%] disabled:opacity-80 authbutton"
                    onClick={usernameClick}
                    disabled={saving}
                >
                    <img src={showUsername ? './rooms/zine/commentBubbles/showUsername_active.png' : "./rooms/zine/commentBubbles/showUsername_inactive.png"} className="w-full h-full image-pixelated" />
                </button>
            </div>
        </div>,
        document.body
    );
}