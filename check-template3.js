const fs = require("fs");
const s = fs.readFileSync("apps/api/src/features/audits/application/report-pdf.ts", "utf8");

const startIdx = s.indexOf("return `<!doctype");
let i = startIdx + "return `".length;
let line = s.slice(0, i).split("\n").length;

// Stack entries: {type:"template"} or {type:"expr",braceDepth}
const stack = [{ type: "template" }];
const errors = [];

while (i < s.length) {
  const c = s[i];
  const top = stack[stack.length - 1];

  if (c === "\n") line++;

  if (c === "\\") { i += 2; continue; }

  if (top.type === "template") {
    if (c === "`") {
      stack.pop();
      if (stack.length === 0) {
        console.log(`Line ${line}: !!! OUTER TEMPLATE CLOSED HERE — extra backtick!`);
        console.log("Context:", JSON.stringify(s.slice(Math.max(0,i-80), i+80)));
        break;
      }
      console.log(`Line ${line}: template closed -> now in ${stack[stack.length-1]?.type}`);
      i++;
      continue;
    }
    if (c === "$" && s[i+1] === "{") {
      stack.push({ type: "expr", braceDepth: 0 });
      console.log(`Line ${line}: \${ opened`);
      i += 2;
      continue;
    }
    i++;
    continue;
  }

  // expr context (JS code)
  if (c === "`") {
    stack.push({ type: "template" });
    i++;
    continue;
  }
  if (c === "{") {
    top.braceDepth++;
    i++;
    continue;
  }
  if (c === "}") {
    if (top.braceDepth === 0) {
      // closes the ${
      stack.pop();
      console.log(`Line ${line}: \${ closed`);
      i++;
      continue;
    }
    top.braceDepth--;
    i++;
    continue;
  }
  i++;
}

if (stack.length > 1) {
  console.log("\nUNCLOSED constructs:");
  for (const item of stack.slice(1)) {
    console.log("-", item.type);
  }
} else {
  console.log("\nAll balanced!");
}
