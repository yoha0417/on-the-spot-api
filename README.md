# On The Spot - Backend

位置情報連動型SNS「On The Spot」のバックエンドリポジトリです。
8月23日のハッカソンMVP提出に向け、開発スピードと保守性のバランスを取った「Pragmatic Clean Architecture」を採用しています。

# クリーンアーキテクチャに基づく設計

## アーキテクチャ概要

本プロジェクトはクリーンアーキテクチャの原則に基づき、以下の層で構成されています:

1. **Controller層** (インターフェース層)
   - HTTPリクエスト/レスポンスの処理
   - 入力バリデーション
   - エラーハンドリング
   - ビジネスロジックを含まない

2. **Usecase層** (アプリケーション層)
   - ビジネスロジックの実装
   - 複数リポジトリの協調
   - トランザクション管理
   - ドメインルールの適用

3. **Repository層** (インフラ層)
   - データ永続化の実装
   - 外部サービス連携
   - DBクエリの実装
   - キャッシュ処理

## 依存関係ルール

- 外側の層は内側の層に依存可能
- 内側の層は外側の層に依存不可
- 層間の通信はインターフェースを介して行う

## 技術スタック
- **実行環境**: Cloudflare Workers
- **フレームワーク**: Hono
- **データベース**: Cloudflare D1 (SQLite)
- **ORM**: Drizzle ORM
- **言語**: TypeScript

## ディレクトリ構造 (Pragmatic Clean Architecture)
関心事の分離を意識し、以下のような構造を採用しています。

```plaintext
src/
 ├── domain/
 │   ├── models/
 │   └── errors/
 ├── usecase/
 ├── infrastructure/
 │   ├── db/
 │   │   ├── schema.ts
 │   │   └── client.ts
 │   └── repositories/
 ├── interface/
 │   ├── controllers/
 │   ├── routes/
 │   └── middleware/
 ├── utils/
 │   └── geo.ts
 └── index.ts
```

## 開発ガイド

### セットアップ・起動
```bash
npm install
npm run dev
```

### デプロイ
```bash
npm run deploy
```

### 型定義の生成・同期
Wranglerの設定に基づいて型を生成します。
```bash
npm run cf-typegen
```
※Hono初期化時には、生成された `CloudflareBindings` をジェネリクスとして渡します。
```typescript
const app = new Hono<{ Bindings: CloudflareBindings }>()
```

### コードの品質チェック（静的解析・型チェック）
コミット前やデプロイ前には、必ず以下のコマンドを実行してコードの品質と型チェックを行ってください。

* **Biome による Lint・コード整形と自動修正:**
  ```bash
  npm run lint:fix
  ```
* **TypeScript による型チェック（コンパイルエラーの検出）:**
  ```bash
  npx -p typescript tsc --noEmit
  ```


## データベース操作 (Drizzle ORM + D1)
DrizzleでのDB変更は、基本的に以下の3ステップのサイクルを回します。

1. **スキーマの定義・変更** (`src/infrastructure/db/schema.ts`)
   - キャメルケースでプロパティを書き、第一引数にスネークケースのDBカラム名を指定します。
   - 型定義（Type）は可能な限りDrizzleから推論（`InferSelectModel`など）させます。
2. **マイグレーションファイルの生成**
   ```bash
   npx drizzle-kit generate
   ```
   - 差分ファイルが `drizzle.config.ts` で指定した出力先（`./drizzle` など）に生成されます。
3. **実データベースへの適用**
   ```bash
   npx wrangler d1 migrations apply DB --local
   ```
   - 本番環境へ適用する場合は `--local` の代わりに `--remote` を使用します。

### 困ったときの処方箋（ローカル環境のリセット）
スキーマ変更が複雑になり、履歴をリセットしたい場合のハッカソン的な対応手順です。
```bash
# 1. マイグレーション履歴とローカルDBを丸ごと削除
rm -rf drizzle
rm -rf .wrangler/state/v3/d1

# 2. 最初からマイグレーションを作り直して適用
npx drizzle-kit generate
npx wrangler d1 migrations apply DB --local

# 3. テストデータを入れ直す
npx tsx scripts/seed.ts
```

### 公園データのシード

新宿区公園一覧のCSVからシード用SQLを生成し、ローカルDBに適用します。

```bash
# 1. SQLファイルの生成
npx tsx scripts/generate-park-seed-sql.ts

# 2. ローカルDBへの適用
npx wrangler d1 execute DB --local --file=drizzle/seed_parks.sql
```

## 主要機能の実装仕様

### 位置情報チェックイン/チェックアウト（ハイブリッド判定方式）
Cloudflare Workersの制限（メモリ・CPU）を考慮し、DB側での事前絞り込みとHono側での正確な距離計算を組み合わせます。

- **判定基準**: スポット（緯度: `lat`, 経度: `lng`）から半径50m以内を「チェックイン圏内」とします。
- **ハイブリッド方式のロジック**:
  1. **Bounding Box (D1側)**: 現在地から東西南北50mの境界箱（Bounding Box）を計算し、`between` 演算子を用いてその範囲内のスポットのみをDBから取得します。
  2. **Haversine公式 (Hono側)**: Usecase内で取得候補に対して球面三角法（Haversine formula）を用いて正確な距離を計算し、50m以内のスポットに対してチェックイン処理（`visits` テーブルへの記録）を行います。

## 開発上の制約事項
- **オーバーエンジニアリングの回避**: ハッカソンに間に合う「実用的な（Pragmatic）」コードを心がけます。
- **外部ライブラリの制限**: エッジ環境（Cloudflare Workers）で動作させるため、Node.js依存のネイティブモジュールは使用しません。距離計算用の外部ライブラリ（`geolib`など）も使用せず、`src/utils/geo.ts` 等に自前で軽量なロジックを実装します。

認証API（登録とログイン）のテストが完全に成功しましたね！無事にJWTトークンが発行されているのが確認できます。これでAPIのセキュリティ基盤が整いました。

プロジェクトの `README.md` に記載するためのマークダウンを用意しました。APIのドキュメントとして、以下の内容をそのままコピーして貼り付けてください。

## 動作確認（テストユーザーの作成とログイン）

APIの認証機能（JWT）をテストするためのコマンド一覧です。
取得した `token` は、認証が必要なエンドポイント（チェックイン、投稿など）にリクエストを送る際、HTTPヘッダーに `Authorization: Bearer <token>` として含めて使用します。

### 1. テストユーザーの登録 (Register)
新規にテストユーザーを作成し、初期トークンを取得します。

```bash
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@example.com","password":"secure123","name":"Test User"}'

```

**レスポンス例:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5c...",
  "user": {
    "id": "6afe6a01-7c0a-4a09-bedf-157ec855d619",
    "email": "test2@example.com",
    "name": "Test User"
  }
}

```

### 2. ログイン (Login)

作成済みのテストユーザーでログインし、JWTトークンを再取得します。

```bash
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@example.com","password":"secure123"}'

```

**レスポンス例:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5c...",
  "user": {
    "id": "6afe6a01-7c0a-4a09-bedf-157ec855d619",
    "email": "test2@example.com",
    "name": "Test User"
  }
}

```
