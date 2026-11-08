import { memo } from 'react';

/**
 * Parses inline formatting: **bold**, *italic*, `code`, and [link](url).
 * Safely converts to React nodes without dangerouslySetInnerHTML.
 */
function parseInline(text) {
  if (!text) return null;

  // Regex matches:
  // 1: **bold**
  // 2: *italic*
  // 3: `code`
  // 4 & 5: [link text](url)
  const regex = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)|(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))/g;
  const elements = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      // **bold**
      elements.push(<strong key={match.index} className="font-bold text-[var(--text)]">{match[2]}</strong>);
    } else if (match[3]) {
      // *italic*
      elements.push(<em key={match.index} className="italic">{match[4]}</em>);
    } else if (match[5]) {
      // `code`
      elements.push(
        <code
          key={match.index}
          className="rounded bg-[var(--surface-3)] px-1.5 py-0.5 font-['JetBrains_Mono',monospace] text-xs text-[var(--cyan)]"
        >
          {match[6]}
        </code>
      );
    } else if (match[7]) {
      // [text](url)
      elements.push(
        <a
          key={match.index}
          href={match[9]}
          target="_blank"
          rel="nofollow noopener noreferrer"
          className="font-medium text-[var(--cyan)] underline underline-offset-2 transition hover:text-[var(--text)]"
        >
          {match[8]}
        </a>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return elements.length > 0 ? elements : text;
}

/**
 * SafeMarkdown — Zero-dependency, XSS-safe Markdown renderer.
 * Handles headings, paragraphs, lists, quotes, code fences, and links.
 */
function SafeMarkdown({ content = '', className = '' }) {
  if (!content) return null;

  const lines = content.split('\n');
  const nodes = [];
  let inCodeBlock = false;
  let codeBuffer = [];
  let inUl = false;
  let inOl = false;
  let listItems = [];

  const flushList = (key) => {
    if (inUl) {
      nodes.push(
        <ul key={`ul-${key}`} className="my-3 ml-5 list-disc space-y-1.5 text-sm sm:text-base leading-relaxed text-[var(--text-2)]">
          {listItems.map((item, idx) => (
            <li key={idx}>{parseInline(item)}</li>
          ))}
        </ul>
      );
      inUl = false;
      listItems = [];
    } else if (inOl) {
      nodes.push(
        <ol key={`ol-${key}`} className="my-3 ml-5 list-decimal space-y-1.5 text-sm sm:text-base leading-relaxed text-[var(--text-2)]">
          {listItems.map((item, idx) => (
            <li key={idx}>{parseInline(item)}</li>
          ))}
        </ol>
      );
      inOl = false;
      listItems = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Code block toggle (```)
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        nodes.push(
          <pre
            key={`code-${i}`}
            className="my-4 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 font-['JetBrains_Mono',monospace] text-xs leading-relaxed text-[var(--cyan)]"
          >
            <code>{codeBuffer.join('\n')}</code>
          </pre>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        flushList(i);
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(rawLine);
      continue;
    }

    // Empty line resets lists and paragraph spacing
    if (!trimmed) {
      flushList(i);
      continue;
    }

    // Blockquote (> )
    if (trimmed.startsWith('>')) {
      flushList(i);
      const quoteText = trimmed.replace(/^>\s*/, '');
      nodes.push(
        <blockquote
          key={`quote-${i}`}
          className="my-4 border-l-4 border-[var(--cyan)] bg-[var(--cyan-dim)] px-4 py-2 text-sm italic text-[var(--text)] rounded-r-lg"
        >
          {parseInline(quoteText)}
        </blockquote>
      );
      continue;
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      flushList(i);
      nodes.push(
        <h3 key={`h3-${i}`} className="mt-6 mb-2 font-['Outfit',sans-serif] text-lg sm:text-xl font-bold tracking-tight text-[var(--text)]">
          {parseInline(trimmed.slice(4))}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith('## ')) {
      flushList(i);
      nodes.push(
        <h2 key={`h2-${i}`} className="mt-8 mb-3 font-['Outfit',sans-serif] text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)] border-b border-[var(--border)] pb-1.5">
          {parseInline(trimmed.slice(3))}
        </h2>
      );
      continue;
    }
    if (trimmed.startsWith('# ')) {
      flushList(i);
      nodes.push(
        <h2 key={`h1-${i}`} className="mt-8 mb-4 font-['Outfit',sans-serif] text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text)]">
          {parseInline(trimmed.slice(2))}
        </h2>
      );
      continue;
    }

    // Unordered list item (- or *)
    const ulMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (ulMatch) {
      if (inOl) flushList(i);
      inUl = true;
      listItems.push(ulMatch[1]);
      continue;
    }

    // Ordered list item (1. 2. etc)
    const olMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (olMatch) {
      if (inUl) flushList(i);
      inOl = true;
      listItems.push(olMatch[1]);
      continue;
    }

    // Standard paragraph
    flushList(i);
    nodes.push(
      <p key={`p-${i}`} className="my-3 text-sm sm:text-base leading-relaxed text-[var(--text-2)]">
        {parseInline(trimmed)}
      </p>
    );
  }

  flushList(lines.length);

  return <div className={`safe-markdown leading-normal ${className}`}>{nodes}</div>;
}

export default memo(SafeMarkdown);
