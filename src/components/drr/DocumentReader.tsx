"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MessageSquarePlus } from "lucide-react";
import { DRRDocument } from "@/lib/types";

interface DocumentReaderProps {
  document: DRRDocument;
  onTextSelect?: (selectedText: string, startOffset: number, endOffset: number) => void;
}

export function DocumentReader({ document, onTextSelect }: DocumentReaderProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleMouseUp = () => {
    if (!onTextSelect) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const text = selection.toString().trim();
    if (!text) return;

    // Standard positioning check
    const range = selection.getRangeAt(0);
    const preSelectionRange = range.cloneRange();
    
    if (containerRef.current) {
      preSelectionRange.selectNodeContents(containerRef.current);
      preSelectionRange.setEnd(range.startContainer, range.startOffset);
      const startOffset = preSelectionRange.toString().length;
      const endOffset = startOffset + text.length;

      onTextSelect(text, startOffset, endOffset);
    }
  };

  return (
    <div 
      ref={containerRef}
      onMouseUp={handleMouseUp}
      className="prose max-w-none select-text focus:outline-none"
    >
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-primary border-b border-gewci-gray/20 pb-3 mb-6 mt-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-primary mt-8 mb-4">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg sm:text-xl font-bold font-heading text-gewci-dark mt-6 mb-3">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-sm sm:text-base text-gewci-dark/85 leading-relaxed mb-4">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-2 mb-4 text-sm sm:text-base text-gewci-dark/80 pl-2">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-2 mb-4 text-sm sm:text-base text-gewci-dark/80 pl-2">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gewci-gold bg-primary/5 rounded-r-lg px-4 py-3 my-5 text-sm sm:text-base italic text-gewci-dark/90">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="bg-gewci-gray/10 text-primary-dark font-mono text-sm px-1.5 py-0.5 rounded border border-gewci-gray/30">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="bg-gewci-dark text-gewci-white font-mono text-sm p-4 rounded-xl overflow-x-auto shadow-inner my-5 border border-gewci-gray/20">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-6 border border-gewci-gray/20 rounded-xl">
              <table className="min-w-full divide-y divide-gewci-gray/20 text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gewci-gray/5">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-gewci-gray/10 bg-white">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr>
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left text-xs font-bold text-gewci-dark/70 uppercase tracking-wider">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-gewci-dark/80 whitespace-pre-line">
              {children}
            </td>
          ),
        }}
      >
        {document.content || "*No content provided.*"}
      </ReactMarkdown>
    </div>
  );
}
