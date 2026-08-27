const fs = require("fs");
const s = fs.readFileSync("apps/api/src/features/audits/application/report-pdf.ts", "utf8");

// Proper template-literal state machine
let i = 0;
let line = 1;
const stack = []; // positions of ${ openings
let inTemplate = 0; // nesting depth of template literals

// Find start of the big return template: "return `<!doctype"
const startIdx = s.indexOf("return `<!doctype");
i = startIdx + "return `".length;
inTemplate = 1;

while (i < s.length) {
  const c = s[i];
  if (c === "\n") line++;
  if (c === "\\") { i += 2; continue; } // skip escaped char
  if (c === "`" && inTemplate > 0) {
    // end of a template literal
    inTemplate--;
    console.log(`Line ${line}: template literal CLOSED (remaining open ${} stack: ${stack.length})`);
    if (stack.length > 0 && inTemplate === 0) {
      const pos = stack[stack.length - 1];
      const posLine = s.slice(0, pos).split("\n").length;
      console.log(`  -> but unclosed \${ from line ${posLine}!`);
    }
    i++;
    continue;
  }
  if (c === "`" ) {
    inTemplate++;
    i++;
    continue;
  }
  if (c === "$" && s[i + 1] === "{") {
    stack.push(i);
    console.log(`Line ${line}: \${ opened (total open: ${stack.length})`);
    i += 2;
    continue;
  }
  if (c === "{" && inTemplate === 0) {
    // code context brace - ignore for this analysis (only tracking template exprs)
    i++;
    continue;
  }
  if (c === "}") {
    if (stack.length > 0) {
      // check: is this } closing a code block or the ${? In our simplified model,
      // inside ${...} there are nested {} braces. We need to track those too.
      // Simple heuristic: if we're at depth where previous non-space char context matters.
      // Too complex; just pop and note mismatch risk.
      const pos = stack.pop();
      console.log(`Line ${line}: } closed (remaining open: ${stack.length})`);
    }
    i++;
    continue;
  }
  i++;
}
console.log("\nFinal:", "open ${ count =", stack.length);
for (const pos of stack) {
  const l = s.slice(0, pos).split("\n").length;
  console.log("Unclosed ${ at line", l, ":", s.slice(pos, pos + 60).replace(/\n/g, "\\n"));
}
