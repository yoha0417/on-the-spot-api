## ⏰ Cron（定期実行）の設定とルーティング

Cloudflare Workersでは、`wrangler.jsonc`にインフラの設定（スケジュール）を書き、コード内で処理を振り分けます。
**設定ファイル上で「どの関数を実行するか」は紐付けられない**ため、`event.cron` の文字列を使って自前でルーティング（分岐）する必要があります。

### 1. スケジュールの定義 (`wrangler.jsonc`)
`triggers.crons` 配列に実行したいスケジュールをLinuxのCron形式で記述します。そのままデプロイ可能です。

```jsonc
{
  // ...
  "triggers": {
    "crons": [
      "*/10 * * * *", // 10分ごとに実行
      "0 9 * * 1"     // 毎週月曜日の朝9時に実行
    ]
  }
}

```

### 2. 処理の振り分け (`src/index.ts`)

すべてのCronリクエストは、エクスポートした **1つの `scheduled` 関数** に集約されます。
`event.cron` に設定した文字列がそのまま入ってくるため、`switch` 文などで処理を分岐させます。

```typescript
import { Hono } from 'hono';
import type { ScheduledEvent, ExecutionContext } from '@cloudflare/workers-types';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// 各バッチ処理を関数として定義
async function syncDatabase(env: Env) {
  console.log('10分ごとのDB同期処理を実行...');
}

async function sendWeeklyReport(env: Env) {
  console.log('毎週月曜のレポート送信処理を実行...');
}

export default {
  // ① 通常のHTTPリクエスト（API）
  fetch: app.fetch,

  // ② Cronによる定期実行
  scheduled: async (event: ScheduledEvent, env: Env, ctx: ExecutionContext) => {
    // wrangler.jsoncに書いた文字列と完全一致させること
    switch (event.cron) {
      case '*/10 * * * *':
        await syncDatabase(env);
        break;
      case '0 9 * * 1':
        await sendWeeklyReport(env);
        break;
      default:
        console.log(`未定義のCronスケジュールです: ${event.cron}`);
    }
  },
};

```

### 🛠️ ローカルでのCronテスト方法

時間を待たずにローカルでCronの動作確認をする場合は、起動時にフラグを付け、専用のエンドポイントを叩いて強制発火させます。

**1. テストモードでサーバーを起動**

```bash
npx wrangler dev --test-scheduled

```

**2. 別のターミナルからリクエストを送信して強制発火（※空白は `+` に置き換える）**

```bash
curl "http://localhost:8787/__scheduled?cron=*/10+*+*+*+*"

```