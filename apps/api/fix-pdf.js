const fs = require("fs");
const p = "apps/api/src/features/audits/application/report-pdf.ts";
let s = fs.readFileSync(p, "utf8");

// Remove calidad section
const marker = "\n\n${\n  calidad?.problems?.length";
const idx = s.indexOf(marker);
if (idx > -1) {
  // Find the end: next `\n}\n</body>`
  const endIdx = s.indexOf("\n}\n</body></html>`;", idx);
  if (endIdx > -1) {
    s = s.slice(0, idx) + "\n</body></html>`;";
    fs.writeFileSync(p, s);
    console.log("removed calidad section");
  } else {
    console.log("end not found");
  }
} else {
  console.log("marker not found");
}

// Also remove "Anexo: calidad de los datos" from TOC
s = fs.readFileSync(p, "utf8");
const tocIdx = s.indexOf('<li>Anexo: calidad de los datos</li>');
if (tocIdx > -1) {
  s = s.slice(0, tocIdx) + s.slice(tocIdx + '<li>Anexo: calidad de los datos</li>'.length);
  fs.writeFileSync(p, s);
  console.log("removed from TOC");
} else {
  console.log("TOC entry not found");
}
