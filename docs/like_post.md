# 目的
位置情報SNSアプリにおいて、投稿に対する「いいね（Like）」をトグル（ON/OFF切り替え）するAPIを実装してください。

# ⚠️ アーキテクチャの重要ルール (最優先)
本プロジェクトでは、Controllerの中に直接データベースのクエリを書かず、**「Usecase（ユースケース）」層を経由するクリーンアーキテクチャの設計ルール**を採用しています。
- **Controllerの役割:** リクエストのバリデーション（Zod）、認証情報の取得、Usecaseの呼び出し、レスポンスの返却のみを行う。
- **Usecaseの役割:** 「いいねをトグルする」というビジネスロジック（DBの検索・挿入・削除の判定）を記述する。
他の既存のエンドポイント（例: チェックインや投稿など）のファイル構成・レイヤー分割のルールを完全に遵守して実装してください。

# 前提
- 使用技術: Hono, Cloudflare D1 (Drizzle ORM), Zod
- 既に `authMiddleware` が実装されており、`c.get("userId")` でユーザーIDが取得可能です。
- AIコーディング規約（`Biome`の厳格なLintルール、`any`の禁止、オプショナルチェイニングの徹底など）を遵守してください。

# 1. データベーススキーマの追加
`schema.ts`（Drizzleのスキーマ定義ファイル）に `likes` テーブルを追加してください。
- `id`: string (主キー, uuid等)
- `post_id`: string (postsテーブルへの外部キー)
- `user_id`: string (usersテーブルへの外部キー)
- `created_at`: integer (タイムスタンプ)
- ※ 1人のユーザーが同じ投稿に複数回いいねできないよう、`post_id` と `user_id` の組み合わせにユニーク制約 (`unique`) を付与すること。

# 2. ユースケースとコントローラーの実装
他の機能と同様のレイヤー構成に従い、以下の実装を行ってください。

1. **Usecase層:**
   - 処理対象の `postId` と `userId` を受け取り、「既存のいいねがあれば削除、なければ作成」を行い、最終的な状態（`liked: boolean`）を返すロジックを実装する。
2. **Controller層 (`POST /:postId/like`):**
   - `zValidator` を使用して URLパラメータ (`param`) から `postId` を検証する。
   - `c.get("userId")` でリクエスト元の `userId` を取得する。
   - Usecaseを呼び出し、結果に応じて `{ liked: true }` または `{ liked: false }` を返す。