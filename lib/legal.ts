import fs from "node:fs";
import path from "node:path";

/*
 * Renders legal/*.md into HTML using the site's own type and colour
 * classes. Tiny and dependency-free: headings, paragraphs, bullets,
 * blockquotes, tables, bold, links, rules — every construct the two
 * documents use. The markdown is ours; text is HTML-escaped.
 */

export function readLegal(name: "privacy" | "terms"): string {
  return fs.readFileSync(path.join(process.cwd(), "legal", `${name}.md`), "utf8");
}

const cls = {
  h1: "font-display text-[34px] font-medium leading-[1.1] tracking-[-0.04em] text-[#2d2230] sm:text-[42px]",
  h2: "font-display mt-10 text-[22px] font-medium tracking-[-0.025em] text-[#2d2230]",
  h3: "mt-6 text-[15px] font-semibold text-[#2d2230]",
  p: "mt-3 text-[15px] leading-[1.75] text-[#453747]",
  ul: "mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-[1.7] text-[#453747]",
  quote:
    "mt-4 rounded-r-[14px] border-l-2 border-[#cb7e28] bg-[#cb7e28]/10 px-4 py-3 text-[14px] leading-[1.65] text-[#453747]",
  table: "mt-4 w-full border-collapse text-[14px]",
  th: "border-b border-[#2d2230]/10 py-2 pr-4 text-left text-[12px] font-semibold tracking-[0.04em] text-[#695969]",
  td: "border-b border-[#2d2230]/10 py-2.5 pr-4 align-top text-[#453747]",
  hr: "my-8 border-0 border-t border-[#2d2230]/10",
  a: "text-[#9b5267] underline-offset-2 hover:underline",
};

function inline(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-[#2d2230]">$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a class="${cls.a}" href="$2">$1</a>`);
}

export function markdownToHtml(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      out.push(`<h1 class="${cls.h1}">${inline(line.slice(2))}</h1>`);
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      out.push(`<h2 class="${cls.h2}">${inline(line.slice(3))}</h2>`);
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      out.push(`<h3 class="${cls.h3}">${inline(line.slice(4))}</h3>`);
      i++;
      continue;
    }
    if (line.trim() === "---") {
      out.push(`<hr class="${cls.hr}" />`);
      i++;
      continue;
    }
    if (line.startsWith("> ")) {
      const parts: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        parts.push(inline(lines[i].slice(2)));
        i++;
      }
      out.push(`<blockquote class="${cls.quote}">${parts.join("<br/>")}</blockquote>`);
      continue;
    }
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(`<li>${inline(lines[i].slice(2))}</li>`);
        i++;
      }
      out.push(`<ul class="${cls.ul}">${items.join("")}</ul>`);
      continue;
    }
    if (line.startsWith("|")) {
      const rows: string[] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        rows.push(lines[i]);
        i++;
      }
      const cells = (row: string) => row.split("|").slice(1, -1).map((c) => c.trim());
      const head = cells(rows[0]).map((c) => `<th class="${cls.th}">${inline(c)}</th>`).join("");
      const body = rows
        .slice(2)
        .map((r) => `<tr>${cells(r).map((c) => `<td class="${cls.td}">${inline(c || "—")}</td>`).join("")}</tr>`)
        .join("");
      out.push(`<table class="${cls.table}"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`);
      continue;
    }

    const parts: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !/^(#|- |\||> |---)/.test(lines[i])) {
      parts.push(inline(lines[i]));
      i++;
    }
    out.push(`<p class="${cls.p}">${parts.join("<br/>")}</p>`);
  }

  return out.join("\n");
}
