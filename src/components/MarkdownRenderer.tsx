import React from "react";

interface MarkdownRendererProps {
  content: string;
}

/**
 * A highly tailored, lightweight, and robust Markdown, JSON, and Rich-Text Parser
 * that does not rely on third-party dependencies, styled beautifully with Tailwind.
 */
export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // 1. Try JSON parsing for structured search APIs
  const tryJSON = (text: string) => {
    try {
      const trimmed = text.trim();
      if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
        const parsed = JSON.parse(trimmed);
        return (
          <div className="bg-slate-900 rounded-xl p-5 overflow-auto max-h-[500px] border border-slate-800 shadow-inner group relative" id="json-block">
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => navigator.clipboard.writeText(JSON.stringify(parsed, null, 2))}
                className="px-2.5 py-1 text-xs font-medium rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
              >
                Копировать JSON
              </button>
            </div>
            <pre className="text-emerald-400 font-mono text-xs leading-relaxed">
              {JSON.stringify(parsed, null, 2)}
            </pre>
          </div>
        );
      }
    } catch {
      // Not valid JSON, continue with markdown rendering
    }
    return null;
  };

  const jsonRender = tryJSON(content);
  if (jsonRender) {
    return jsonRender;
  }

  // 2. Process traditional Markdown line-by-line / block-by-block
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Horizontal Ruler
    if (line.trim() === "---") {
      elements.push(<hr key={`hr-${i}`} className="my-6 border-slate-200" />);
      i++;
      continue;
    }

    // Code block
    if (line.trim().startsWith("```")) {
      const lang = line.trim().substring(3) || "code";
      let codeContent = "";
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeContent += lines[i] + "\n";
        i++;
      }
      i++; // Skip closing backticks
      
      elements.push(
        <div key={`code-${i}`} className="bg-slate-900 rounded-xl my-5 border border-slate-800 overflow-hidden shadow-md group relative">
          <div className="flex justify-between items-center px-4 py-2 bg-slate-950/60 border-b border-slate-850 text-slate-400 font-mono text-[10px]">
            <span>{lang.toUpperCase()}</span>
            <button
              onClick={() => navigator.clipboard.writeText(codeContent.trim())}
              className="text-slate-400 hover:text-slate-100 active:scale-95 transition"
              title="Скопировать"
            >
              Копировать
            </button>
          </div>
          <pre className="p-4 overflow-x-auto text-sky-300 font-mono text-xs leading-relaxed">
            <code>{codeContent.trim()}</code>
          </pre>
        </div>
      );
      continue;
    }

    // Headers
    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={`h1-${i}`} className="text-3xl font-bold font-sans tracking-tight text-slate-900 mt-8 mb-4 border-b pb-2">
          {parseInline(line.substring(2))}
        </h1>
      );
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-2xl font-bold font-sans tracking-tight text-slate-800 mt-6 mb-3">
          {parseInline(line.substring(3))}
        </h2>
      );
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-lg font-semibold font-sans tracking-tight text-slate-700 mt-5 mb-2">
          {parseInline(line.substring(4))}
        </h3>
      );
      i++;
      continue;
    }

    // Table mapping
    if (line.startsWith("|")) {
      const tableLines: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        // Skip separator lines such as |:---|:---|
        if (!lines[i].includes("---")) {
          const cells = lines[i]
            .split("|")
            .map(c => c.trim())
            .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
          tableLines.push(cells);
        }
        i++;
      }
      
      if (tableLines.length > 0) {
        const headers = tableLines[0];
        const rows = tableLines.slice(1);
        elements.push(
          <div key={`table-${i}`} className="overflow-x-auto my-5 border border-slate-200 rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {headers.map((h, idx) => (
                    <th key={idx} className="px-4 py-2.5 text-left font-semibold text-slate-700 font-sans">
                      {parseInline(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-sans text-slate-600">
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50/50">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-4 py-2 text-slate-600">
                        {parseInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    // Bullet Lists
    if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
      const listItems: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith("* ") || lines[i].trim().startsWith("- "))) {
        // Strip bullet
        const clean = lines[i].trim();
        listItems.push(clean.substring(2));
        i++;
      }
      elements.push(
        <ul key={`list-${i}`} className="list-disc list-inside space-y-1.5 my-3.5 text-slate-600 font-sans text-sm pl-4">
          {listItems.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {parseInline(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered Lists
    if (/^\d+\.\s/.test(line.trim())) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        const clean = lines[i].trim();
        // Extract content after "X. "
        const match = clean.match(/^\d+\.\s(.*)/);
        if (match) {
          listItems.push(match[1]);
        }
        i++;
      }
      elements.push(
        <ol key={`numlist-${i}`} className="list-decimal list-inside space-y-1.5 my-3.5 text-slate-600 font-sans text-sm pl-4">
          {listItems.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {parseInline(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Normal paragraph or block
    if (line.trim()) {
      elements.push(
        <p key={`p-${i}`} className="text-slate-600 font-sans text-sm leading-relaxed mb-4">
          {parseInline(line)}
        </p>
      );
    }
    i++;
  }

  return <div className="space-y-1 selection:bg-sky-100 selection:text-slate-900">{elements}</div>;
}

/**
 * Lightweight helper to render inline formatting (bold, italic, inline code)
 */
function parseInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let index = 0;

  // Regex to look for **bold**, *italic*, and `code`
  const parserRegex = /(\*\*.*?\*\*|\*.*?\*|`.*?`|\$\$.*?\$\$)/g;
  const matches = text.split(parserRegex);

  for (const part of matches) {
    if (part.startsWith("**") && part.endsWith("**")) {
      parts.push(<strong key={index++} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>);
    } else if (part.startsWith("*") && part.endsWith("*")) {
      parts.push(<em key={index++} className="italic text-slate-700">{part.slice(1, -1)}</em>);
    } else if (part.startsWith("`") && part.endsWith("`")) {
      parts.push(<code key={index++} className="bg-slate-100 text-rose-600 px-1.5 py-0.5 rounded font-mono text-xs">{part.slice(1, -1)}</code>);
    } else if (part.startsWith("$$") && part.endsWith("$$")) {
      parts.push(<span key={index++} className="font-mono bg-sky-50 text-indigo-700 border border-sky-100 px-1.5 py-0.5 rounded mx-0.5 text-xs italic">{part.slice(2, -2)}</span>);
    } else {
      parts.push(part);
    }
  }

  return parts;
}
