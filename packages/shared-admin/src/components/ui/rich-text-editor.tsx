"use client";

import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { cn } from "../../lib/utils";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Heading2,
  Heading3,
  Minus,
  Undo,
  Redo,
  RemoveFormatting,
} from "lucide-react";

export interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-1.5 rounded-t-md">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={cn(
          "p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors",
          editor.isActive("bold") ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold" : ""
        )}
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={cn(
          "p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors",
          editor.isActive("italic") ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" : ""
        )}
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={cn(
          "p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors",
          editor.isActive("strike") ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" : ""
        )}
        title="Strikethrough"
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </button>

      <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-0.5" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={cn(
          "p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors",
          editor.isActive("heading", { level: 2 }) ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold" : ""
        )}
        title="Heading 2"
      >
        <Heading2 className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={cn(
          "p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors",
          editor.isActive("heading", { level: 3 }) ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold" : ""
        )}
        title="Heading 3"
      >
        <Heading3 className="h-3.5 w-3.5" />
      </button>

      <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-0.5" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn(
          "p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors",
          editor.isActive("bulletList") ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold" : ""
        )}
        title="Bullet List"
      >
        <List className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn(
          "p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors",
          editor.isActive("orderedList") ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold" : ""
        )}
        title="Numbered List"
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={cn(
          "p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors",
          editor.isActive("blockquote") ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" : ""
        )}
        title="Blockquote"
      >
        <Quote className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
        title="Horizontal Line"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>

      <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-0.5" />

      <button
        type="button"
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
        title="Clear Formatting"
      >
        <RemoveFormatting className="h-3.5 w-3.5" />
      </button>

      <div className="flex-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 disabled:opacity-30 transition-colors"
        title="Undo (Ctrl+Z)"
      >
        <Undo className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 disabled:opacity-30 transition-colors"
        title="Redo (Ctrl+Y)"
      >
        <Redo className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Enter comprehensive clinical applications, key device capabilities, indications, and workflow features...",
  className,
  minHeight = "min-h-[220px]",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass:
          "cursor-text before:content-[attr(data-placeholder)] before:absolute before:text-zinc-400 before:pointer-events-none before:italic",
      }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none p-3.5 leading-relaxed font-sans text-xs text-zinc-800 dark:text-zinc-200",
          minHeight
        ),
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      if (html === "<p></p>") {
        onChange?.("");
      } else {
        onChange?.(html);
      }
    },
  });

  // Keep editor content in sync when incoming value changes from outside (e.g. AI generator)
  useEffect(() => {
    if (editor && value !== undefined) {
      const currentHtml = editor.getHTML();
      if (currentHtml !== value && !(value === "" && currentHtml === "<p></p>")) {
        editor.commands.setContent(value);
      }
    }
  }, [value, editor]);

  return (
    <div
      className={cn(
        "flex flex-col rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus-within:ring-1 focus-within:ring-zinc-900 dark:focus-within:ring-zinc-100 transition-all",
        className
      )}
    >
      <MenuBar editor={editor} />
      <div className="relative overflow-y-auto max-h-[420px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
