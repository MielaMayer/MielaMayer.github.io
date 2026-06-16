// Generate beautiful two-column HTML (cover + body + references) for Miela's two
// essays, from the extracted JSON content. Render to PDF with headless Chrome (separate step).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const RES = "/Users/mioli/coding_local/geo-publish/spaces/_research";
const OUT = "/Users/mioli/coding_local/miela-site/build";
mkdirSync(OUT, { recursive: true });

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const dropClass = (s) => /\bEVST\b|Final\s+Paper|Miela\s+Mayer\s*$/i.test((s || "").trim()) && (s || "").trim().length < 60;

function buildHtml({ json, title, subtitle, author, year, accent, coverNote }) {
  const data = JSON.parse(readFileSync(`${RES}/${json}`, "utf8"));
  let first = true;
  const body = (data.sections || []).map((sec) => {
    const isAbstract = /abstract/i.test(sec.heading || "");
    const head = sec.heading && !dropClass(sec.heading) ? `<h2${isAbstract ? ' class="abstract-h"' : ""}>${esc(sec.heading)}</h2>` : "";
    const paras = (sec.paragraphs || []).filter((p) => p && p.trim() && !dropClass(p)).map((p) => {
      const cls = first ? ' class="lead"' : "";
      first = false;
      return `<p${cls}>${esc(p)}</p>`;
    }).join("\n");
    return head + paras;
  }).join("\n");
  const refs = (data.bibliography || []).map((r) => {
    const bits = [r.name, r.authors, r.year].filter(Boolean).map(esc).join(". ");
    const link = r.url ? ` <a href="${esc(r.url)}">${esc(r.url)}</a>` : "";
    return `<li>${bits}.${link}</li>`;
  }).join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&family=Spectral:ital,wght@0,400;0,500;0,600;1,400&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  @page { size: letter; margin: 0.8in 0.75in; }
  :root{ --accent:${accent}; --ink:#24201c; --muted:#7c7269; --rule:#d8cfbf; }
  *{box-sizing:border-box}
  body{ font-family:"Spectral",Georgia,serif; color:var(--ink); font-size:10.4pt; line-height:1.5; margin:0; }
  a{ color:var(--accent); text-decoration:none; }
  /* cover */
  .cover{ height:9.1in; display:flex; flex-direction:column; justify-content:center; page-break-after:always; }
  .cover .kicker{ font-family:"Space Mono",monospace; letter-spacing:.24em; text-transform:uppercase; font-size:9pt; color:var(--accent); }
  .cover h1{ font-family:"Fraunces",serif; font-weight:600; font-size:42pt; line-height:1.02; letter-spacing:-.01em; margin:.18in 0 .12in; }
  .cover .sub{ font-family:"Fraunces",serif; font-style:italic; font-weight:400; font-size:19pt; color:#473f38; line-height:1.2; max-width:6in; }
  .cover .rule{ width:1.5in; border:0; border-top:2.5px solid var(--accent); margin:.3in 0; }
  .cover .by{ font-family:"Space Mono",monospace; font-size:10.5pt; letter-spacing:.04em; }
  .cover .note{ margin-top:.35in; font-size:10pt; font-style:italic; color:var(--muted); max-width:5.2in; line-height:1.45; }
  .cover .note a{ border-bottom:1px solid var(--accent); }
  /* body */
  main{ column-count:2; column-gap:.42in; text-align:justify; hyphens:auto; -webkit-hyphens:auto; orphans:2; widows:2; }
  h2{ font-family:"Space Mono",monospace; font-size:8.6pt; letter-spacing:.14em; text-transform:uppercase; color:var(--accent); margin:13pt 0 4pt; break-after:avoid; }
  h2.abstract-h{ color:var(--muted); }
  p{ margin:0 0 7pt; }
  p.lead{ margin-top:0; }
  p.lead::first-letter{ font-family:"Fraunces",serif; font-weight:600; font-size:30pt; line-height:.85; float:left; padding:2pt 5pt 0 0; color:var(--accent); }
  .refs{ font-size:8.4pt; color:#3a332e; line-height:1.38; padding-left:14pt; margin-top:4pt; }
  .refs li{ margin-bottom:3.5pt; break-inside:avoid; }
  h2.refs-h{ column-span:all; border-top:1px solid var(--rule); padding-top:8pt; margin-top:10pt; }
</style></head>
<body>
  <section class="cover">
    <div class="kicker">${esc(author)} · Essay</div>
    <h1>${esc(title)}</h1>
    <div class="sub">${esc(subtitle)}</div>
    <hr class="rule">
    <div class="by">${esc(author)}${year ? ` · ${esc(year)}` : ""}</div>
    ${coverNote ? `<div class="note">${coverNote}</div>` : ""}
  </section>
  <main>
    ${body}
    <h2 class="refs-h">References</h2>
    <ol class="refs">${refs}</ol>
  </main>
</body></html>`;
}

const PAPERS = [
  {
    out: "learning-to-let-nature.html", json: "permaculture-essay.json",
    title: "Learning to Let Nature Do the Work", subtitle: "A Review of Permaculture's Potential within the American Agriculture Industry",
    author: "Miela Mayer", year: "", accent: "#3f6b4a",
  },
  {
    out: "agroforestry-yield-gap.html", json: "agroforestry.json",
    title: "Questioning our Yield Gap", subtitle: "Agroforestry's Potential within the American Agriculture Industry",
    author: "Miela Mayer", year: "", accent: "#9a5a25",
    coverNote: `A follow-on to <a href="https://mielamayer.github.io/pdfs/learning-to-let-nature.pdf">Learning to Let Nature Do the Work: A Review of Permaculture's Potential within the American Agriculture Industry</a> — extending that overview of the permaculture landscape into a closer look at agroforestry.`,
  },
];

for (const p of PAPERS) { writeFileSync(`${OUT}/${p.out}`, buildHtml(p)); console.log("wrote", p.out); }
