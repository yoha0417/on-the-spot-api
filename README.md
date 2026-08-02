```txt
npm install
npm run dev
```

```txt
npm run deploy
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiating `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```

1. Drizzleマイグレーションの全体像（3つのステップ）
DrizzleでのDB変更は、基本的に以下のサイクルをグルグル回していきます。

Plaintext
[1. schema.tsを書き換える] 
       ↓ (設計変更)
[2. npx drizzle-kit generate] 
       ↓ (SQLファイルを自動生成)
[3. wrangler d1 migrations apply DB --local] 
       ↓ (実データベースへ適用)
これを1つずつおさらいしておきましょう。

① スキーマの定義・変更 (src/db/schema.ts)
やること: 「新しいカラムを追加したい」「新しいテーブルを作りたい」となったら、まずはここを書き換えます。

ポイント: キャメルケースでプロパティを書きつつ、第一引数には必ずスネークケースのDBカラム名を指定します（例: createdAt: text('created_at')）。

② マイグレーションファイルの生成 (npx drizzle-kit generate)
やること: schema.ts の変更内容を読み取り、「前回から何が変わったか」を自動で計算して、変更用のSQLファイル（差分ファイル）を生成します。

出力先: 設定ファイル（drizzle.config.ts）の out で指定したフォルダ（例: drizzle/）に、0001_xxxx.sql のような名前で保存されます。

注意点: この時点ではまだ実際のローカルDBの構造は変わっていません（設計図を作っただけの状態）。

③ 実データベースへの適用 (npx wrangler d1 migrations apply DB --local)
やること: 生成されたSQLファイルを、Wranglerを経由してローカルのCloudflare D1（SQLite）に流し込み、テーブルを実際に変更します。

本番環境への適用: ローカルではなく本番（Cloudflare上）に反映させたい場合は、最後に --local の代わりに --remote をつけて実行します。

Bash
npx wrangler d1 migrations apply DB --remote
2. 今後よくある「困ったときの処方箋」
開発中には「スキーマを変えすぎてマイグレーションの履歴がごちゃごちゃになった！」ということがよく起きます。そんなときのハッカソン的なリセット術です。

完全に最初からやり直したい時（ローカル開発中のみ有効）
古い履歴やローカルDBのファイルはゴミ箱に捨てて、まっさらな状態から作り直した方が早いです。

Bash
# 1. マイグレーション履歴とローカルDBを丸ごと削除
rm -rf drizzle
rm -rf .wrangler/state/v3/d1

# 2. 最初からマイグレーションを作り直して適用
npx drizzle-kit generate
npx wrangler d1 migrations apply DB --local

# 3. テストデータを入れ直す
npx tsx scripts/seed.ts