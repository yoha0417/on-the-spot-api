// scripts/seed.ts
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

// ⚠️ ご自身のプロジェクトのスキーマパスに合わせて変更してください
import { places,users } from '../src/infrastructure/db/schema'; 

// 1. Wranglerが生成したローカルD1のSQLiteファイルを自動探索
const d1Dir = path.resolve('.wrangler/state/v3/d1/miniflare-D1DatabaseObject');

if (!fs.existsSync(d1Dir)) {
  console.error('❌ ローカルDBフォルダが見つかりません。一度APIにリクエストを送ってDBを初期化してください。');
  process.exit(1);
}

const files = fs.readdirSync(d1Dir);
const sqliteFile = files.find(f => f.endsWith('.sqlite'));

if (!sqliteFile) {
  console.error('❌ SQLiteファイルが見つかりません。');
  process.exit(1);
}

const dbPath = path.join(d1Dir, sqliteFile);
console.log(`🔌 Connecting to local D1: ${dbPath}`);

// 2. DB接続とDrizzleインスタンス化
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

async function main() {
  console.log('🌱 Seeding data...');

  // 1. 先にテストユーザーを作成（idを 'current-user-id' にする）
  await db.insert(users).values([
    {
      id: 'current-user-id',
      email: 'test@example.com',
      passwordHash: 'dummy_hash',
      name: 'テストユーザー',
    },
  ]).onConflictDoNothing(); // 既存の場合はスキップ

  // 3. テストデータの投入
  await db.insert(places).values([
    {
      id: 'place_1', // UUID等を生成している場合は適宜変更してください
      name: '都庁前広場（50m以内）',
      latitude: 35.6896,  // 指定座標から約11m
      longitude: 139.6917,
    },
    {
      id: 'place_2',
      name: '新宿中央公園（50m以内）',
      latitude: 35.6895,  
      longitude: 139.6912, // 指定座標から約45m
    },
    {
      id: 'place_3',
      name: '新宿駅西口（50m圏外）',
      latitude: 35.6905,   // 指定座標から約111m
      longitude: 139.6950,
    },
  ]);

  console.log('✅ Seeding complete!');
}

main().catch((err) => {
  console.error('❌ Seeding failed:', err);
}).finally(() => {
  sqlite.close();
});