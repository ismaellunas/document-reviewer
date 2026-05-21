"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MessageSquarePlus } from "lucide-react";
import { DRRDocument } from "@/lib/types";

interface DocumentReaderProps {
  doc: DRRDocument;
  onTextSelect?: (selectedText: string, startOffset: number, endOffset: number) => void;
}

interface PendingSelection {
  text: string;
  startOffset: number;
  endOffset: number;
  /** Viewport-coords for the bottom-center of the selection rect. */
  viewportX: number;
  viewportY: number;
}

function isSelectionInside(container: HTMLElement, selection: Selection) {
  if (selection.rangeCount === 0) return false;
  const range = selection.getRangeAt(0);
  return container.contains(range.commonAncestorContainer);
}

export function DocumentReader({ doc, onTextSelect }: DocumentReaderProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const lastSelectionKeyRef = React.useRef("");
  // Tracks whether the most recent input was touch (vs. mouse). Set on
  // touchstart / mousedown so handlers know which UX flow to follow.
  const lastInputWasTouchRef = React.useRef(false);
  const [pending, setPending] = React.useState<PendingSelection | null>(null);

  const computeSelection = React.useCallback((): PendingSelection | null => {
    const container = containerRef.current;
    if (!container) return null;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null;
    if (!isSelectionInside(container, selection)) return null;

    const text = selection.toString().trim();
    if (!text) return null;

    const range = selection.getRangeAt(0);
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(container);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const startOffset = preSelectionRange.toString().length;
    const endOffset = startOffset + text.length;

    const rect = range.getBoundingClientRect();
    return {
      text,
      startOffset,
      endOffset,
      viewportX: rect.left + rect.width / 2,
      viewportY: rect.bottom,
    };
  }, []);

  const fireSelection = React.useCallback(
    (sel: PendingSelection) => {
      if (!onTextSelect) return;
      const key = `${sel.startOffset}:${sel.endOffset}:${sel.text}`;
      if (lastSelectionKeyRef.current === key) return;
      lastSelectionKeyRef.current = key;
      onTextSelect(sel.text, sel.startOffset, sel.endOffset);
    },
    [onTextSelect],
  );

  React.useEffect(() => {
    if (!onTextSelect) return;

    const container = containerRef.current;
    if (!container) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const captureNow = () => {
      const sel = computeSelection();
      if (!sel) {
        setPending(null);
        return;
      }
      if (lastInputWasTouchRef.current) {
        // On touch we never auto-open the drawer -- we surface a small
        // pill and wait for the user to confirm. This avoids the iOS
        // bug where the drawer slid up mid-drag and stole the selection.
        setPending(sel);
      } else {
        // Desktop: sidebar is already visible; fire immediately so the
        // form pre-fills with the highlighted anchor text.
        fireSelection(sel);
      }
    };

    const scheduleCapture = (delayMs: number) => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        captureNow();
      }, delayMs);
    };

    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        lastSelectionKeyRef.current = "";
        setPending(null);
        if (debounceTimer) {
          clearTimeout(debounceTimer);
          debounceTimer = null;
        }
        return;
      }
      // Generous debounce on touch so handle-drags don't trip the capture
      // mid-gesture. Desktop selection settles synchronously on mouseup,
      // so the shorter delay is fine there.
      const delay = lastInputWasTouchRef.current ? 600 : 200;
      scheduleCapture(delay);
    };

    const handleTouchStart = () => {
      lastInputWasTouchRef.current = true;
    };

    const handleTouchEnd = () => {
      // iOS continues to fire selectionchange while the selection handles
      // animate into place after touchend. Wait long enough for that to
      // settle before reading the selection.
      scheduleCapture(350);
    };

    const handleMouseDown = () => {
      lastInputWasTouchRef.current = false;
    };

    const handleMouseUp = () => {
      scheduleCapture(0);
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });
    container.addEventListener("mousedown", handleMouseDown);
    container.addEventListener("mouseup", handleMouseUp);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      document.removeEventListener("selectionchange", handleSelectionChange);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("mousedown", handleMouseDown);
      container.removeEventListener("mouseup", handleMouseUp);
    };
  }, [onTextSelect, computeSelection, fireSelection]);

  // Hide the pill if the page is scrolled significantly -- otherwise the
  // fixed-position pill drifts away from the (now-scrolled) selection.
  React.useEffect(() => {
    if (!pending) return;
    const onScroll = () => setPending(null);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pending]);

  // pointerdown fires before any focus shift / selection collapse, so we
  // can read the pending offsets reliably even if iOS's tap handling is
  // about to clear the selection.
  const handlePillPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!pending) return;
    fireSelection(pending);
    setPending(null);
  };

  return (
    <div className="relative">
      <div
        ref={containerRef}
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
              <li className="leading-relaxed">{children}</li>
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
              <thead className="bg-gewci-gray/5">{children}</thead>
            ),
            tbody: ({ children }) => (
              <tbody className="divide-y divide-gewci-gray/10 bg-white">
                {children}
              </tbody>
            ),
            tr: ({ children }) => <tr>{children}</tr>,
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
          {doc.content || "*No content provided.*"}
        </ReactMarkdown>
      </div>

      {pending && (
        <button
          type="button"
          onPointerDown={handlePillPointerDown}
          // Belt-and-braces: prevent the mousedown on desktop from
          // stealing focus/collapsing the selection before pointerdown
          // fires its callback. Click is a no-op since pointerdown ran.
          onMouseDown={(e) => e.preventDefault()}
          style={{
            position: "fixed",
            left: pending.viewportX,
            top: pending.viewportY + 8,
            transform: "translateX(-50%)",
            zIndex: 50,
          }}
          className="bg-primary text-gewci-white shadow-lg rounded-full px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-transform select-none whitespace-nowrap"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          <span>Add comment</span>
        </button>
      )}
    </div>
  );
}
