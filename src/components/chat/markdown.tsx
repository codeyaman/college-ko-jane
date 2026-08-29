import { Fragment, type ReactNode } from "react";

/**
 * Minimal, XSS-safe markdown renderer for assistant messages.
 * Supports: paragraphs, - bullets, 1. numbered lists, **bold**, *italic*, `code`.
 * No dangerouslySetInnerHTML — everything is parsed into React elements.
 */

function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={i} className="font-semibold text-cream-50">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={i}
          className="rounded-md border border-ink-600 bg-ink-800 px-1.5 py-0.5 text-[0.82em] text-saffron-300"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function Markdown({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="space-y-3">
      {blocks.map((block, bi) => {
        const lines = block
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        if (lines.length === 0) return null;

        if (lines.every((l) => /^[-•]\s+/.test(l))) {
          return (
            <ul key={bi} className="space-y-1.5">
              {lines.map((l, li) => (
                <li key={li} className="flex gap-2.5">
                  <span className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-saffron-500/80" />
                  <span>{renderInline(l.replace(/^[-•]\s+/, ""))}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (lines.every((l) => /^\d+[.)]\s+/.test(l))) {
          return (
            <ol key={bi} className="space-y-1.5">
              {lines.map((l, li) => (
                <li key={li} className="flex gap-2.5">
                  <span className="mt-px shrink-0 font-display text-[0.9em] text-saffron-400">
                    {li + 1}.
                  </span>
                  <span>{renderInline(l.replace(/^\d+[.)]\s+/, ""))}</span>
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p key={bi} className="leading-relaxed">
            {renderInline(lines.join(" "))}
          </p>
        );
      })}
    </div>
  );
}
