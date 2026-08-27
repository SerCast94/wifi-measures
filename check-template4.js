const fs = require("fs");
const s = fs.readFileSync("apps/api/src/features/audits/application/report-pdf.ts", "utf8");

let i = 0;
let line = 1;
const stack = [{ type: "code", braceDepth: 0 }];

while (i < s.length) {
  const c = s[i];
  const top = stack[stack.length - 1];
  if (!top) {
    console.log(`Line ${line}: STACK EMPTY — context: ${JSON.stringify(s.slice(Math.max(0,i-80), i+80))}`);
    break;
  }
  if (c === "\n") { line++; i++; continue; }
  if (c === "\\") {
    // escaped char only special in strings/templates; naive skip is ok here
    i += 2;
    continue;
  }

  if (top.type === "template") {
    if (c === "`") { stack.pop(); i++; continue; }
    if (c === "$" && s[i + 1] === "{") { stack.push({ type: "expr", braceDepth: 0 }); i += 2; continue; }
    i++;
    continue;
  }

  if (top.type === "sq" || top.type === "dq") {
    if ((top.type === "sq" && c === "'") || (top.type === "dq" && c === '"')) stack.pop();
    i++;
    continue;
  }

  // code / expr
  if (c === "/" && s[i + 1] === "/") { while (i < s.length && s[i] !== "\n") i++; continue; }
  if (c === "/" && s[i + 1] === "*") { i += 2; while (i < s.length && !(s[i] === "*" && s[i+1] === "/")) { if (s[i] === "\n") line++; i++; } i += 2; continue; }
  if (c === "'") { stack.push({ type: "sq" }); i++; continue; }
  if (c === '"') { stack.push({ type: "dq" }); i++; continue; }
  if (c === "`") { stack.push({ type: "template" }); i++; continue; }
  if (c === "{") { top.braceDepth++; i++; continue; }
  if (c === "}") {
    if (top.type === "expr" && top.braceDepth === 0) { stack.pop(); i++; continue; }
    top.braceDepth--;
    i++;
    continue;
  }
  i++;
}

console.log("Remaining stack:");
for (const item of stack) console.log("-", item.type, item.braceDepth ?? "");

// Now find WHERE the unclosed { is: rerun tracking positions of open braces in code context
const openBraces = []; // {line, ctx}
let i2 = 0;
let line2 = 1;
const st2 = [{ type: "code" }];
while (i2 < s.length) {
  const c = s[i2];
  const top = st2[st2.length - 1];
  if (!top) break;
  if (c === "\n") { line2++; i2++; continue; }
  if (c === "\\") { i2 += 2; continue; }
  if (top.type === "template") {
    if (c === "`") { st2.pop(); i2++; continue; }
    if (c === "$" && s[i2 + 1] === "{") { st2.push({ type: "expr", depth: 0 }); i2 += 2; continue; }
    i2++; continue;
  }
  if (top.type === "sq") { if (c === "'") st2.pop(); i2++; continue; }
  if (top.type === "dq") { if (c === '"') st2.pop(); i2++; continue; }
  if (c === "/" && s[i2 + 1] === "/") { while (i2 < s.length && s[i2] !== "\n") i2++; continue; }
  if (c === "/" && s[i2 + 1] === "*") { i2 += 2; while (i2 < s.length && !(s[i2] === "*" && s[i2+1] === "/")) { if (s[i2] === "\n") line2++; i2++; } i2 += 2; continue; }
  if (c === "'") { st2.push({ type: "sq" }); i2++; continue; }
  if (c === '"') { st2.push({ type: "dq" }); i2++; continue; }
  if (c === "`") { st2.push({ type: "template" }); i2++; continue; }
  if (c === "{") {
    top.depth = (top.depth ?? 0) + 1;
    openBraces.push({ line: line2, type: top.type });
    i2++; continue;
  }
  if (c === "}") {
    if (top.type === "expr" && (top.depth ?? 0) === 0) { st2.pop(); i2++; continue; }
    top.depth = (top.depth ?? 0) - 1;
    // pop last matching open
    for (let k = openBraces.length - 1; k >= 0; k--) {
      if (openBraces[k].type === top.type || true) { openBraces.splice(k, 1); break; }
    }
    i2++; continue;
  }
  i2++;
}
console.log("\nUnclosed { at:", JSON.stringify(openBraces));
