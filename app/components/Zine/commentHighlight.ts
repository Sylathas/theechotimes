"use client";
import { useEffect, RefObject } from "react";

const supportsHighlights = () => typeof CSS !== "undefined" && "highlights" in CSS;

export function rangeFromOffsets(container: HTMLElement, start: number, end: number): Range | null {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    let position = 0;
    let foundStart = false;
    let node: Node | null;

    while ((node = walker.nextNode())) {
        const length = node.textContent?.length ?? 0;
        if (!foundStart && start < position + length) {
            range.setStart(node, start - position);
            foundStart = true;
        }
        if (foundStart && end <= position + length) {
            range.setEnd(node, end - position);
            return range;
        }
        position += length;
    }
    return null;
}

export function getCommentRange(container: HTMLElement, comment: any): Range | null {
    const ref = comment?.comment_reference;
    if (!ref || typeof ref !== "object") return null;
    const range = rangeFromOffsets(container, ref.start, ref.end);
    if (!range || range.toString() !== ref.quote) return null;
    return range;
}

export function offsetFromPoint(container: HTMLElement, x: number, y: number): number | null {
    const doc = document as any;
    let node: Node | null = null, offset = 0;
    if (doc.caretPositionFromPoint) {
        const pos = doc.caretPositionFromPoint(x, y);
        if (pos) { node = pos.offsetNode; offset = pos.offset; }
    } else if (doc.caretRangeFromPoint) {
        const range = doc.caretRangeFromPoint(x, y);
        if (range) { node = range.startContainer; offset = range.startOffset; }
    }
    if (!node || !container.contains(node)) return null;
    const before = document.createRange();
    before.selectNodeContents(container);
    before.setEnd(node, offset);
    return before.toString().length;
}

export function useCommentHighlights(
    containerRef: RefObject<HTMLElement | null>,
    comments: any[] | undefined,
    text: string | undefined
) {
    useEffect(() => {
        const container = containerRef.current;
        if (!container || !supportsHighlights()) return;

        const ranges = (comments ?? [])
            .map((comment) => getCommentRange(container, comment))
            .filter((range): range is Range => range !== null);

        CSS.highlights.set("comments", new Highlight(...ranges));
        return () => {
            CSS.highlights.delete("comments");
            CSS.highlights.delete("comment-active");
        };
    }, [containerRef, comments, text]);
}

export function focusComment(container: HTMLElement, comment: any, scroll = true): boolean {
    const range = getCommentRange(container, comment);
    if (!range) return false;
    if (supportsHighlights()) {
        const active = new Highlight(range);
        active.priority = 1; // drawn on top of the other comment highlights where they overlap
        CSS.highlights.set("comment-active", active);
    }
    if (scroll) scrollToRange(container, range);
    return true;
}

function scrollToRange(container: HTMLElement, range: Range) {
    const rect = Array.from(range.getClientRects()).find((r) => r.width > 0 && r.height > 0)
        ?? range.getBoundingClientRect();
    const scroller = findScrollParent(container);
    if (!scroller) {
        range.startContainer.parentElement?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
    }
    const offset = rect.top - scroller.getBoundingClientRect().top;
    scroller.scrollTo({ top: scroller.scrollTop + offset - scroller.clientHeight / 3, behavior: "smooth" });
}

function findScrollParent(element: HTMLElement): HTMLElement | null {
    let node: HTMLElement | null = element;
    while (node) {
        const { overflowY } = getComputedStyle(node);
        if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) return node;
        node = node.parentElement;
    }
    return null;
}