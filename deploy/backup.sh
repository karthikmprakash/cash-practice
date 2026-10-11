#!/bin/sh
# Snapshot the live SQLite file out of the Compose volume.
set -eu
cd "$(dirname "$0")/.."

dest="${1:-./backups}"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
remote="/tmp/cashpractice-${stamp}.db"
mkdir -p "$dest"

docker compose exec -T app node -e '
const Database = require("better-sqlite3");
const dest = process.argv[2];
const db = new Database(process.env.DATABASE_PATH, { fileMustExist: true });
db.pragma("wal_checkpoint(PASSIVE)");
db.backup(dest).then(() => db.close()).catch((error) => {
  console.error(error);
  process.exit(1);
});
' "$remote"

docker compose cp "app:${remote}" "${dest}/cashpractice-${stamp}.db"
docker compose exec -T app rm -f "$remote"
echo "${dest}/cashpractice-${stamp}.db"
