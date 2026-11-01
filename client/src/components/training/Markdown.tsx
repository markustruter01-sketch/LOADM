import { Fragment, type ReactNode } from "react";

/**
 * A deliberately tiny markdown renderer for reading content. Supports
 * `#`/`##`/`###` headings, paragraphs, `**bold**`, `-`/`*` bullet lists and
 * `1.` numbered lists. Everything is rendered as text nodes, so raw HTML in
 * the source is shown literally rather than interpreted.
 */

type Block =
  | { kind: "heading"; level: 1 | 2 | 3; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; ordered: boolean; items: string[] };

function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ kind: "paragraph", text: paragraph.join(" ") });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list) {
      blocks.push({ kind: "list", ...list });
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ kind: "heading", level: heading[1].length as 1 | 2 | 3, text: heading[2].trim() });
      continue;
    }
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    const listMatch = bullet ?? numbered;
    if (listMatch) {
      flushParagraph();
      const ordered = numbered !== null;
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push(listMatch[1]);
      continue;
    }
    flushList();
    paragraph.push(line.trim());
  }
  flushParagraph();
  flushList();
  return blocks;
}

/** Render `**bold**` spans inside a line of text. */
function inline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function Markdown({ source, className }: { source: string; className?: string }) {
  const blocks = parseBlocks(source);
  return (
    <div className={className}>
      {blocks.map((b, i) => {
        switch (b.kind) {
          case "heading":
            if (b.level === 1) return <h2 key={i} className="mt-6 text-xl font-semibold tracking-tight first:mt-0">{inline(b.text)}</h2>;
            if (b.level === 2) return <h3 key={i} className="mt-5 text-lg font-semibold first:mt-0">{inline(b.text)}</h3>;
            return <h4 key={i} className="mt-4 text-base font-semibold first:mt-0">{inline(b.text)}</h4>;
          case "paragraph":
            return <p key={i} className="mt-3 text-sm leading-relaxed text-foreground/90 first:mt-0">{inline(b.text)}</p>;
          case "list":
            return b.ordered ? (
              <ol key={i} className="mt-3 list-decimal space-y-1 pl-6 text-sm leading-relaxed text-foreground/90">
                {b.items.map((item, j) => <li key={j}>{inline(item)}</li>)}
              </ol>
            ) : (
              <ul key={i} className="mt-3 list-disc space-y-1 pl-6 text-sm leading-relaxed text-foreground/90">
                {b.items.map((item, j) => <li key={j}>{inline(item)}</li>)}
              </ul>
            );
        }
      })}
    </div>
  );
}
