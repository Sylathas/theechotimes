"use client";
import { useEffect } from "react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";

export function useMarkdownEditor(original: string, editing: boolean) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({ underline: false, link: { openOnClick: false } }),
            Markdown,
        ],
        immediatelyRender: false,
    });

    useEffect(() => {
        if (editor && editing) editor.commands.setContent(original, { contentType: "markdown" });
    }, [editor, editing, original]);

    const run = () => editor?.chain().focus();

    const headingLevel = () => [1, 2, 3, 4, 5, 6].find((level) => editor?.isActive("heading", { level })) ?? 0;

    const changeHeading = (direction: 1 | -1) => {
        const level = headingLevel();
        const next = direction === 1
            ? (level === 0 ? 3 : Math.max(level - 1, 1))
            : (level === 0 || level >= 3 ? 0 : level + 1);
        if (next === 0) run()?.setParagraph().run();
        else run()?.setHeading({ level: next as 1 | 2 | 3 }).run();
    };

    const link = () => {
        if (!editor) return;
        const previous = editor.getAttributes("link").href ?? "";
        const url = window.prompt("Link address (leave empty to remove the link)", previous);
        if (url === null) return;
        const chain = editor.chain().focus().extendMarkRange("link");
        if (url === "") chain.unsetLink().run();
        else chain.setLink({ href: url }).run();
    };

    const actions = {
        bold: () => run()?.toggleBold().run(),
        italic: () => run()?.toggleItalic().run(),
        strikethrough: () => run()?.toggleStrike().run(),
        link,
        clear: () => run()?.unsetAllMarks().clearNodes().run(),
        biggerHeading: () => changeHeading(1),
        smallerHeading: () => changeHeading(-1),
        bulletList: () => run()?.toggleBulletList().run(),
        numberedList: () => run()?.toggleOrderedList().run(),
        quote: () => run()?.toggleBlockquote().run(),
    };

    const getMarkdown = () => editor?.getMarkdown() ?? original;

    return { editor, actions, getMarkdown };
}