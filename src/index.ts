import { Hono } from 'hono';
import { createDb } from './infrastructure/db/client';
import { sql } from 'drizzle-orm';
// ※ usersテーブルのスキーマパスは実際のファイル構成に合わせて調整してください
import { users } from './infrastructure/db/schema'; 
import { checkInController } from './interface/controllers/checkInController';

// Cloudflare Workersの環境変数とHonoコンテキストの型定義
type Bindings = {
  DB: D1Database; // wrangler.jsonc の binding 名と一致させる
};

type Variables = {
  db: ReturnType<typeof createDb>; // Drizzleインスタンスの型
};

// 型を適用してHonoインスタンスを作成
const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Middleware to initialize DB connection
app.use(async (c, next) => {
  // 修正箇所: D1_DATABASE ではなく DB を参照する
  const db = c.env?.DB;
  
  if (!db) {
    return c.text('D1 database not initialized', 500);
  }
  
  // Create Drizzle instance and set to context
  c.set('db', createDb(db));
  await next();
});

// Test endpoint
app.get('/', async (c) => {
  const db = c.get('db');
  
  try {
    // Simple user count query
    const [result] = await db.select({ count: sql`COUNT(*)` }).from(users);
    return c.json({ userCount: result?.count || 0 });
  } catch (error) {
    // DBクエリ実行時のエラーをターミナルに表示
    console.error('[Database Error]', error);
    return c.json({ error: 'Database error', details: (error as Error).message }, 500);
  }
});

// 2. コントローラーをルートに登録！
// これにより POST / へのリクエストが checkInController に流れます
app.route('/', checkInController);

// グローバルなエラーハンドリング（予期せぬエラー用）
app.onError((err, c) => {
  console.error(`[Global Error] ${err.message}`);
  console.error(err.stack);
  return c.text('Internal Server Error', 500);
});

export default app;