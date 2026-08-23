import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Heading2,
  Heading3,
  Undo,
  Redo,
} from "lucide-react";

export interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 p-2 rounded-t-xl">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={cn(
          "p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors",
          editor.isActive("bold") ? "bg-muted text-foreground" : ""
        )}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={cn(
          "p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors",
          editor.isActive("italic") ? "bg-muted text-foreground" : ""
        )}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={cn(
          "p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors",
          editor.isActive("strike") ? "bg-muted text-foreground" : ""
        )}
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </button>
      
      <div className="w-px h-6 bg-border mx-1" />
      
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={cn(
          "p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors",
          editor.isActive("heading", { level: 2 }) ? "bg-muted text-foreground" : ""
        )}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={cn(
          "p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors",
          editor.isActive("heading", { level: 3 }) ? "bg-muted text-foreground" : ""
        )}
        title="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-border mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn(
          "p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors",
          editor.isActive("bulletList") ? "bg-muted text-foreground" : ""
        )}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn(
          "p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors",
          editor.isActive("orderedList") ? "bg-muted text-foreground" : ""
        )}
        title="Ordered List"
      >
        <ListOrdered className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={cn(
          "p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors",
          editor.isActive("blockquote") ? "bg-muted text-foreground" : ""
        )}
        title="Blockquote"
      >
        <Quote className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-border mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="p-2 rounded-md hover:bg-muted text-muted-foreground disabled:opacity-50 transition-colors"
        title="Undo"
      >
        <Undo className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="p-2 rounded-md hover:bg-muted text-muted-foreground disabled:opacity-50 transition-colors"
        title="Redo"
      >
        <Redo className="h-4 w-4" />
      </button>
    </div>
  );
};

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing here...",
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
        emptyEditorClass:
          "cursor-text before:content-[attr(data-placeholder)] before:absolute before:top-4 before:left-4 before:text-muted-foreground before:opacity-50 before-pointer-events-none",
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[150px] p-4",
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  // Update editor content when value prop changes (e.g., from AI generation)
  useEffect(() => {
    if (editor && value !== undefined && editor.getHTML() !== value) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-input bg-transparent shadow-sm focus-within:ring-1 focus-within:ring-ring focus-within:border-primary transition-all",
        className
      )}
    >
      <MenuBar editor={editor} />
      <div className="relative overflow-y-auto max-h-[400px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
