"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";

interface MarkdownViewProps {
  content: string;
  className?: string;
}

/**
 * High-legibility Markdown renderer for NyayaGraph AI Detective Copilot.
 * Supports crisp light mode (charcoal/warm neutrals) and dark mode (obsidian slate).
 */
export const MarkdownView: React.FC<MarkdownViewProps> = ({ content, className = "" }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  if (!content || typeof content !== "string") return null;

  // Split content into lines
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];

  let inList = false;
  let listItems: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];

  const flushList = () => {
    if (inList && listItems.length > 0) {
      blocks.push(
        <ul
          key={`list-${blocks.length}`}
          className={`my-2 space-y-1.5 pl-4 ${isDark ? "text-[#e1e2e8]" : "text-[#202124]"}`}
        >
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const flushCodeBlock = () => {
    if (inCodeBlock && codeBlockLines.length > 0) {
      blocks.push(
        <pre
          key={`code-${blocks.length}`}
          className={`my-3 overflow-x-auto rounded-xl border p-3 font-mono text-xs ${
            isDark
              ? "border-[#262833] bg-[#14151c] text-[#f5f4ef]"
              : "border-[#e8e4da] bg-[#f9f8f4] text-[#1c1d22]"
          }`}
        >
          <code>{codeBlockLines.join("\n")}</code>
        </pre>
      );
      codeBlockLines = [];
      inCodeBlock = false;
    }
  };

  const parseInline = (text: string): React.ReactNode[] => {
    // Regex for inline code `code`, bold **bold**, italic *italic*
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    while (remaining.length > 0) {
      // Inline code
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        parts.push(
          <code
            key={`c-${keyIdx++}`}
            className={`rounded-md border px-1.5 py-0.5 font-mono text-[11px] font-semibold ${
              isDark
                ? "border-[#2a2c38] bg-[#1a1b24] text-[#f5b838]"
                : "border-[#e4dfd3] bg-[#faf8f3] text-[#b87c12]"
            }`}
          >
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }

      // Bold text **text**
      const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
      if (boldMatch) {
        parts.push(
          <strong
            key={`b-${keyIdx++}`}
            className={`font-bold ${isDark ? "text-white" : "text-[#1c1d22]"}`}
          >
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // Italic text *text*
      const italicMatch = remaining.match(/^\*([^*]+)\*/);
      if (italicMatch) {
        parts.push(
          <em
            key={`i-${keyIdx++}`}
            className={`italic ${isDark ? "text-[#dcdde4]" : "text-[#4a4b52]"}`}
          >
            {italicMatch[1]}
          </em>
        );
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }

      // Plain text up to next special char
      const nextSpecial = remaining.search(/[`*]/);
      if (nextSpecial === -1) {
        parts.push(remaining);
        break;
      } else if (nextSpecial === 0) {
        parts.push(remaining[0]);
        remaining = remaining.slice(1);
      } else {
        parts.push(remaining.slice(0, nextSpecial));
        remaining = remaining.slice(nextSpecial);
      }
    }

    return parts;
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Code block toggle
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        flushCodeBlock();
      } else {
        flushList();
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      return;
    }

    // Empty line
    if (!trimmed) {
      flushList();
      return;
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      flushList();
      blocks.push(
        <h4
          key={`h4-${idx}`}
          className={`mt-3 mb-1.5 text-xs font-bold uppercase tracking-wider ${
            isDark ? "text-white" : "text-[#1c1d22]"
          }`}
        >
          {parseInline(trimmed.slice(4))}
        </h4>
      );
      return;
    }

    if (trimmed.startsWith("## ")) {
      flushList();
      blocks.push(
        <h3
          key={`h3-${idx}`}
          className={`mt-4 mb-2 text-sm font-bold uppercase tracking-wider ${
            isDark ? "text-white" : "text-[#1c1d22]"
          }`}
        >
          {parseInline(trimmed.slice(3))}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith("# ")) {
      flushList();
      blocks.push(
        <h2
          key={`h2-${idx}`}
          className={`mt-4 mb-2 text-base font-extrabold ${
            isDark ? "text-white" : "text-[#1c1d22]"
          }`}
        >
          {parseInline(trimmed.slice(2))}
        </h2>
      );
      return;
    }

    // Bulleted list items: • or - or *
    if (
      trimmed.startsWith("• ") ||
      trimmed.startsWith("- ") ||
      (trimmed.startsWith("* ") && !trimmed.startsWith("**"))
    ) {
      inList = true;
      const bulletContent = trimmed.slice(2);
      listItems.push(
        <li key={`li-${idx}`} className="flex items-start gap-2 leading-relaxed">
          <span className={`select-none ${isDark ? "text-[#f5b838]" : "text-[#b87c12]"}`}>•</span>
          <span className="flex-1">{parseInline(bulletContent)}</span>
        </li>
      );
      return;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      flushList();
      blocks.push(
        <div
          key={`quote-${idx}`}
          className={`my-2 border-l-2 pl-3 py-1 text-xs italic ${
            isDark
              ? "border-[#f5b838] bg-[#1a1b24]/60 text-[#a1a1aa]"
              : "border-[#b87c12] bg-[#f4efe4]/60 text-[#555660]"
          }`}
        >
          {parseInline(trimmed.slice(2))}
        </div>
      );
      return;
    }

    // Regular paragraph line
    flushList();
    blocks.push(
      <p
        key={`p-${idx}`}
        className={`my-1.5 leading-relaxed ${isDark ? "text-[#e1e2e8]" : "text-[#202124]"}`}
      >
        {parseInline(line)}
      </p>
    );
  });

  flushList();
  flushCodeBlock();

  return <div className={`space-y-1 ${className}`}>{blocks}</div>;
};
