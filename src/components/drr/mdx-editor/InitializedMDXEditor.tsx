"use client";

import type { ForwardedRef } from "react";
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CreateLink,
  DiffSourceToggleWrapper,
  InsertTable,
  InsertThematicBreak,
  ListsToggle,
  MDXEditor,
  Separator,
  UndoRedo,
  codeBlockPlugin,
  diffSourcePlugin,
  headingsPlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  type MDXEditorMethods,
  type MDXEditorProps,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";

const EDITOR_PLUGINS = [
  headingsPlugin(),
  listsPlugin(),
  quotePlugin(),
  thematicBreakPlugin(),
  markdownShortcutPlugin(),
  linkPlugin(),
  linkDialogPlugin(),
  tablePlugin(),
  codeBlockPlugin({ defaultCodeBlockLanguage: "text" }),
  diffSourcePlugin({ viewMode: "rich-text", diffMarkdown: "" }),
  toolbarPlugin({
    toolbarClassName: "document-mdx-toolbar",
    toolbarContents: () => (
      <DiffSourceToggleWrapper>
        <UndoRedo />
        <Separator />
        <BlockTypeSelect />
        <Separator />
        <BoldItalicUnderlineToggles />
        <Separator />
        <ListsToggle />
        <Separator />
        <CreateLink />
        <InsertTable />
        <InsertThematicBreak />
      </DiffSourceToggleWrapper>
    ),
  }),
];

interface InitializedMDXEditorProps extends MDXEditorProps {
  editorRef: ForwardedRef<MDXEditorMethods> | null;
}

export default function InitializedMDXEditor({
  editorRef,
  contentEditableClassName,
  ...props
}: InitializedMDXEditorProps) {
  return (
    <MDXEditor
      {...props}
      ref={editorRef}
      plugins={EDITOR_PLUGINS}
      contentEditableClassName={[
        "document-editor-content prose max-w-none",
        contentEditableClassName,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
