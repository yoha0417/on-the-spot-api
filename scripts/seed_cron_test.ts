// scripts/seed_cron_test.ts
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { visits } from "../src/infrastructure/db/schema";

const d1Dir = path.resolve(".wrangler/state/v3/d1/miniflare-D1DatabaseObject");

if (!fs.existsSync(d1Dir)) {
	console.error("❌ ローカルDBフォルダが見つかりません。");
	process.exit(1);
}

const files = fs.readdirSync(d1Dir);
const sqliteFile = files.find((f) => f.endsWith(".sqlite"));

if (!sqliteFile) {
	console.error("❌ SQLiteファイルが見つかりません。");
	process.exit(1);
}

const dbPath = path.join(d1Dir, sqliteFile);
console.log(`🔌 Connecting to local D1: ${dbPath}`);

const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

async function main() {
	// 既存の滞在データをクリア
	await db.delete(visits);

	const now = new Date();
	const fortyMinutesAgo = new Date(now.getTime() - 40 * 60 * 1000);
	const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

	// 1. 期限切れの滞在レコード (40分前)
	await db.insert(visits).values({
		id: "visit_expired",
		userId: "current-user-id",
		placeId: "place_1",
		checkedInAt: fortyMinutesAgo.toISOString(),
		lastHeartbeatAt: fortyMinutesAgo.toISOString(),
		status: "active",
	});

	// 2. 生存中の滞在レコード (10分前)
	await db.insert(visits).values({
		id: "visit_active",
		userId: "current-user-id",
		placeId: "place_2",
		checkedInAt: tenMinutesAgo.toISOString(),
		lastHeartbeatAt: tenMinutesAgo.toISOString(),
		status: "active",
	});

	console.log("✅ Cron test data seed complete!");
}

main()
	.catch((err) => {
		console.error("❌ Seed failed:", err);
	})
	.finally(() => {
		sqlite.close();
	});
