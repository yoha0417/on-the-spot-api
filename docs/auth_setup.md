# 認証基盤と環境変数のセットアップ手順 (Hono + Cloudflare D1)

## 1. ローカル環境のシークレットキー設定 (`.dev.vars`)
Cloudflare Workersのローカル開発では、機密情報を `wrangler.jsonc` ではなく `.dev.vars` に記述して管理します。

1. プロジェクトのルートディレクトリに `.dev.vars` ファイルを作成する。
2. 以下の内容を記述する（値は推測されないランダムな文字列を使用）。

```env
JWT_SECRET="your-super-secret-random-string"

```

※ **注意:** `.dev.vars` は絶対にGitにコミットしないこと（通常は `.gitignore` に含まれている）。

## 2. TypeScriptの型定義 (Bindingsの追加)

環境変数（`c.env.JWT_SECRET` や `c.env.DB`）にアクセスする際のTypeScriptエラーを防ぐため、Honoインスタンス生成時に `Bindings` の型を明示します。

**ファイル:** `src/index.ts`

```typescript
import { Hono } from "hono";

// 環境変数の型を定義
type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
};

// インスタンス生成時に型を渡す
const app = new Hono<{ Bindings: Bindings }>();

// 環境変数をコンテキストにセットするグローバルミドルウェア
app.use(async (c, next) => {
  const db = c.env.DB;
  const secret = c.env.JWT_SECRET;

  if (!db || !secret) {
    return c.text("Configuration error", 500);
  }

  c.set("db", createDb(db));
  c.set("JWT_SECRET", secret);
  await next();
});

```

## 3. 認証ミドルウェアのルーティング適用

Honoの `app.route()` は引数を2つしか取れないため、ミドルウェア（`authMiddleware`）は事前に `app.use()` で適用するか、ルーターをグループ化して適用します。

**推奨されるグループ化の実装例:**

```typescript
// ==========================================
// 1. パブリックなルート (認証不要)
// ==========================================
app.route("/api/places", placeController);
app.route("/api/auth", authController);

// ==========================================
// 2. 認証が必要なルート (グループ化)
// ==========================================
const protectedApp = new Hono();

// グループ内のすべてのアクセスにミドルウェアを適用
protectedApp.use("/*", authMiddleware);

// コントローラーをマウント
protectedApp.route("/checkin", checkInController);
protectedApp.route("/heartbeat", heartbeatController);
protectedApp.route("/posts", postController);

// メインの app にマウント
app.route("/api", protectedApp);

```

## 4. 本番デプロイ時のシークレット設定 (備忘録)

本番環境（Cloudflare上）には `.dev.vars` の内容は反映されません。
デプロイを行う際は、以下のWranglerコマンドを実行して、本番用の `JWT_SECRET` を安全に登録します。

```bash
npx wrangler secret put JWT_SECRET

```

※ コマンド実行後、プロンプトに従って本番用のランダムな文字列を入力する。