import fs from "node:fs";
import path from "node:path";

const SECRET = /STRIPE_SECRET_KEY|DATA_ENCRYPTION_KEY|SESSION_SECRET|STRIPE_WEBHOOK_SECRET|sk_live_|sk_test_|whsec_|NEXT_PUBLIC_[A-Z0-9_]*(SECRET|KEY|TOKEN)/;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx?|jsx?|mjs|cjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function findClientSecretRefs(roots) {
  const hits = [];
  for (const root of roots) {
    for (const file of walk(root)) {
      const text = fs.readFileSync(file, "utf8");
      if (!/['"]use client['"]/.test(text)) continue;
      if (SECRET.test(text)) hits.push(path.relative(process.cwd(), file));
    }
  }
  return hits;
}

const roots = process.argv.slice(2);
const dirs = roots.length > 0 ? roots : ["app", "src"];
const hits = findClientSecretRefs(dirs);
if (hits.length > 0) {
  console.error("client bundle references a secret:");
  for (const hit of hits) console.error(`  ${hit}`);
  process.exit(1);
}
console.log("client secret guard: ok");
