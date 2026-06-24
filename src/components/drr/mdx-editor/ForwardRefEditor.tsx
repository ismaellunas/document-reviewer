"use client";

import dynamic from "next/dynamic";
import { forwardRef } from "react";
import type { MDXEditorMethods, MDXEditorProps } from "@mdxeditor/editor";

const Editor = dynamic(() => import("./InitializedMDXEditor"), {
  ssr: false,
  loading: () => (
    <div
      className="document-mdx-editor-shell min-h-[360px] animate-pulse rounded-[--radius-button] border border-gewci-gray/40 bg-gewci-gray/5"
      aria-hidden
    />
  ),
});

export const ForwardRefEditor = forwardRef<MDXEditorMethods, MDXEditorProps>(
  (props, ref) => <Editor {...props} editorRef={ref} />,
);

ForwardRefEditor.displayName = "ForwardRefEditor";
