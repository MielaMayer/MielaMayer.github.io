// Rebuild the two essay PDFs straight from the .docx (via mammoth) so images,
// figures, tables, appendices, and footnotes are preserved — wrapped in a cover
// page + two-column editorial design. Render to PDF with headless Chrome (next step).
import mammoth from "mammoth";
import { writeFileSync, mkdirSync } from "node:fs";

const OUT = "/Users/mioli/coding_local/miela-site/build";
mkdirSync(OUT, { recursive: true });
const PW = "/Users/mioli/Library/Mobile Documents/com~apple~CloudDocs/Miela Computer Native Docs + Folders etc/Jobs - mac native/Potential writing samples";

const PAPERS = [
  { docx: `${PW}/Learning to let Nature do the Work (final with footnotes).docx`, out: "learning-to-let-nature.html",
    title: "Learning to Let Nature Do the Work", subtitle: "A Review of Permaculture's Potential within the American Agriculture Industry",
    accent: "#3f6b4a", titleRx: /Learning to Let Nature/i,
    coverNote: `See the second chapter of this piece — <a href="https://mielamayer.github.io/pdfs/agroforestry-yield-gap.pdf">Questioning our Yield Gap: Agroforestry's Potential within the American Agriculture Industry</a>.` },
  { docx: `${PW}/FinalDraftEPL.docx`, out: "agroforestry-yield-gap.html",
    title: "Questioning our Yield Gap", subtitle: "Agroforestry's Potential within the American Agriculture Industry",
    accent: "#9a5a25", titleRx: /Questioning our Yield Gap/i,
    coverNote: `A follow-on to <a href="https://mielamayer.github.io/pdfs/learning-to-let-nature.pdf">Learning to Let Nature Do the Work: A Review of Permaculture's Potential within the American Agriculture Industry</a> — extending that overview of the permaculture landscape into a closer look at agroforestry.` },
];

// Remove block elements (h1/h2/h3/p) whose visible text matches any pattern.
function stripBlocks(html, patterns) {
  return html.replace(/<(h1|h2|h3|p)\b[^>]*>([\s\S]*?)<\/\1>/gi, (m, _t, inner) => {
    const text = inner.replace(/<[^>]+>/g, "").replace(/&[a-z]+;/gi, " ").trim();
    return patterns.some((rx) => rx.test(text)) ? "" : m;
  });
}

function template(p, body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&family=Spectral:ital,wght@0,400;0,500;0,600;1,400&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  @page { size: letter; margin: 0.8in 0.72in; }
  :root{ --accent:${p.accent}; --ink:#24201c; --muted:#7c7269; --rule:#d8cfbf; }
  *{box-sizing:border-box}
  body{ font-family:"Spectral",Georgia,serif; color:var(--ink); font-size:10.3pt; line-height:1.5; margin:0; }
  a{ color:var(--accent); text-decoration:none; }
  .cover{ height:9.1in; display:flex; flex-direction:column; justify-content:center; page-break-after:always; }
  .cover .kicker{ font-family:"Space Mono",monospace; letter-spacing:.24em; text-transform:uppercase; font-size:9pt; color:var(--accent); }
  .cover h1{ font-family:"Fraunces",serif; font-weight:600; font-size:42pt; line-height:1.02; letter-spacing:-.01em; margin:.18in 0 .12in; }
  .cover .sub{ font-family:"Fraunces",serif; font-style:italic; font-weight:400; font-size:19pt; color:#473f38; line-height:1.2; max-width:6in; }
  .cover .rule{ width:1.5in; border:0; border-top:2.5px solid var(--accent); margin:.3in 0; }
  .cover .by{ font-family:"Space Mono",monospace; font-size:10.5pt; }
  .cover .note{ margin-top:.35in; font-size:10pt; font-style:italic; color:var(--muted); max-width:5.2in; line-height:1.45; }
  .cover .note a{ border-bottom:1px solid var(--accent); }
  main{ column-count:2; column-gap:.4in; text-align:justify; hyphens:auto; -webkit-hyphens:auto; orphans:2; widows:2; }
  main h1,main h2,main h3{ font-family:"Space Mono",monospace; letter-spacing:.1em; text-transform:uppercase; color:var(--accent); break-after:avoid; }
  main h1{ font-size:10pt; margin:14pt 0 4pt; } main h2{ font-size:9pt; margin:13pt 0 4pt; } main h3{ font-size:8.4pt; color:var(--muted); margin:10pt 0 3pt; }
  p{ margin:0 0 7pt; }
  img{ max-width:100%; height:auto; }
  figure.fig{ column-span:all; text-align:center; margin:12pt 0; break-inside:avoid; }
  figure.fig img{ max-width:84%; max-height:4.4in; border:1px solid var(--rule); border-radius:2px; }
  table{ width:100%; border-collapse:collapse; font-size:7.4pt; line-height:1.3; column-span:all; margin:10pt 0; break-inside:avoid; }
  th,td{ border:1px solid var(--rule); padding:2.5pt 4pt; text-align:left; vertical-align:top; }
  ol,ul{ margin:0 0 7pt; padding-left:14pt; } li{ margin-bottom:3pt; }
  sup{ font-size:.7em; } sup a{ text-decoration:none; }
</style></head>
<body>
  <section class="cover">
    <div class="kicker">Miela Mayer · Essay</div>
    <h1>${p.title}</h1>
    <div class="sub">${p.subtitle}</div>
    <hr class="rule">
    <div class="by">Miela Mayer</div>
    ${p.coverNote ? `<div class="note">${p.coverNote}</div>` : ""}
  </section>
  <main>${body}</main>
</body></html>`;
}

for (const p of PAPERS) {
  const result = await mammoth.convertToHtml({ path: p.docx });
  let body = stripBlocks(result.value, [/\bEVST\b/i, /Final\s*Paper/i, /^Miela\s+Mayer$/i, /Barbara\s+Stuart/i, /English\s*114/i, /Section\s*23/i, p.titleRx]);
  body = body.replace(/<p>\s*(<img[^>]*>)\s*<\/p>/gis, '<figure class="fig">$1</figure>');
  const imgs = (result.value.match(/<img/gi) || []).length;
  const tables = (result.value.match(/<table/gi) || []).length;
  writeFileSync(`${OUT}/${p.out}`, template(p, body));
  console.log(`wrote ${p.out} — ${imgs} images, ${tables} tables, ${result.messages.length} mammoth msgs`);
}
