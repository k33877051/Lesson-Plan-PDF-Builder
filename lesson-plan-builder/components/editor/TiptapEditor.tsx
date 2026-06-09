"use client";

import { useEditor, EditorContent, JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TiptapEditorProps {
  content: string;
  jsonContent?: JSONContent | null;
  onChange: (html: string, json: JSONContent) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export function TiptapEditor({
  content,
  jsonContent,
  onChange,
  placeholder = "เริ่มพิมพ์...",
  className,
  minHeight = "200px",
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: jsonContent || content || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const json = editor.getJSON();
      onChange(html, json);
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none focus:outline-none",
          "prose-headings:font-bold prose-headings:text-foreground",
          "prose-p:text-foreground prose-p:my-2",
          "prose-ul:list-disc prose-ul:pl-5 prose-ul:my-2",
          "prose-ol:list-decimal prose-ol:pl-5 prose-ol:my-2",
          "prose-li:my-1",
          "prose-strong:font-bold",
          "prose-em:italic",
          "[&_p]:text-foreground [&_p]:my-2",
          "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-3",
          "[&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-3",
          "[&_h3]:text-lg [&_h3]:font-bold [&_h3]:my-2",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2",
          "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2",
          "[&_li]:my-1"
        ),
        placeholder,
      },
    },
  });

  // อัปเดตเนื้อหาเมื่อ props เปลี่ยน (เฉพาะเมื่อโหลดครั้งแรก)
  useEffect(() => {
    if (editor) {
      const currentContent = editor.getHTML();
      if (content !== currentContent && content !== "<p></p>") {
        editor.commands.setContent(jsonContent || content);
      }
    }
  }, [content, jsonContent, editor]);

  if (!editor) {
    return (
      <div
        className={cn(
          "border rounded-md p-4 bg-muted/50 animate-pulse",
          className
        )}
        style={{ minHeight }}
      >
        <div className="h-4 bg-muted rounded w-3/4 mb-2" />
        <div className="h-4 bg-muted rounded w-1/2 mb-2" />
        <div className="h-4 bg-muted rounded w-5/6" />
      </div>
    );
  }

  return (
    <div className={cn("border rounded-md overflow-hidden bg-background", className)}>
      {/* Toolbar */}
      <div className="border-b bg-muted/50 p-2 flex flex-wrap gap-1 items-center">
        {/* Text Style */}
        <div className="flex gap-1">
          <Toggle
            size="sm"
            pressed={editor.isActive("bold")}
            onPressedChange={() => editor.chain().focus().toggleBold().run()}
            aria-label="ตัวหนา"
          >
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("italic")}
            onPressedChange={() => editor.chain().focus().toggleItalic().run()}
            aria-label="ตัวเอียง"
          >
            <Italic className="h-4 w-4" />
          </Toggle>
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Headings */}
        <div className="flex gap-1">
          <Toggle
            size="sm"
            pressed={editor.isActive("heading", { level: 1 })}
            onPressedChange={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            aria-label="หัวข้อใหญ่"
          >
            <Heading1 className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("heading", { level: 2 })}
            onPressedChange={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            aria-label="หัวข้อกลาง"
          >
            <Heading2 className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("heading", { level: 3 })}
            onPressedChange={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            aria-label="หัวข้อเล็ก"
          >
            <Heading3 className="h-4 w-4" />
          </Toggle>
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Lists */}
        <div className="flex gap-1">
          <Toggle
            size="sm"
            pressed={editor.isActive("bulletList")}
            onPressedChange={() =>
              editor.chain().focus().toggleBulletList().run()
            }
            aria-label="รายการจุด"
          >
            <List className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("orderedList")}
            onPressedChange={() =>
              editor.chain().focus().toggleOrderedList().run()
            }
            aria-label="รายการตัวเลข"
          >
            <ListOrdered className="h-4 w-4" />
          </Toggle>
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Undo/Redo */}
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="p-4" style={{ minHeight }}>
        <EditorContent editor={editor} className="prose prose-sm max-w-none" />
      </div>
    </div>
  );
}

export default TiptapEditor;
