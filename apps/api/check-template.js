const fs = require("fs");
const s = fs.readFileSync("apps/api/src/features/audits/application/report-pdf.ts", "utf8");
const lines = s.split("\n");

// Check for unmatched template ${} by tracking from line 168 (return `)
let depth = 0;
let inTemplate = false;
for (let i = 167; i < lines.length; i++) {
  const l = lines[i];
  for (let j = 0; j < l.length; j++) {
    if (l[j] === "$" && l[j + 1] === "{") {
      depth++;
    }
    if (l[j] === "}" && depth > 0) {
      depth--;
    }
  }
  if (depth > 0 && i > 167) {
    // track if line has ${
    if (l.includes("${")) {
      console.log(`line ${i+1}: depth=${depth} :: ${l.substring(0, 80)}`);
    }
  }
}
console.log("final depth:", depth);
