import fs from "node:fs";
import path from "node:path";

const database = path.join(process.cwd(), "data", "e2e.db");

export default function globalSetup() {
  fs.mkdirSync(path.dirname(database), { recursive: true });
  for (const suffix of ["", "-wal", "-shm"]) fs.rmSync(database + suffix, { force: true });
}
