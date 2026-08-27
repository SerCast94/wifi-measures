const ts = require("typescript");
const fs = require("fs");
const path = "apps/api/src/features/audits/application/report-pdf.ts";
const source = fs.readFileSync(path, "utf8");
const sf = ts.createSourceFile(path, source, ts.ScriptTarget.ES2022, true);
const diagnostics = sf.parseDiagnostics;
for (const d of diagnostics.slice(0, 5)) {
  const start = sf.getLineAndCharacterOfPosition(d.start);
  const msg = ts.flattenDiagnosticMessageText(d.messageText, "\n");
  console.log(`Line ${start.line + 1}, Col ${start.character + 1}: ${msg}`);
  const lines = source.split("\n");
  for (let i = Math.max(0, start.line - 2); i <= Math.min(lines.length - 1, start.line + 1); i++) {
    console.log(`${i === start.line ? ">>" : "  "} ${i + 1}: ${lines[i].substring(0, 120)}`);
  }
}
if (diagnostics.length === 0) console.log("No parse errors found!");
