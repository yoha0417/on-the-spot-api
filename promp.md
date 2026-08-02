# 依頼概要
現在、Cloudflare Workers (Hono) + Cloudflare D1 (SQLite) を使用して、位置情報連動型SNS「On The Spot」のバックエンドを開発しています。
8月23日のハッカソンMVP提出に向けて、開発スピードと保守性のバランスを取った「Pragmatic Clean Architecture」へのリファクタリングと、**Drizzle ORM**の導入をお願いします。

## 技術スタック
- 実行環境: Cloudflare Workers
- フレームワーク: Hono
- データベース: Cloudflare D1
- ORM: Drizzle ORM (今回新規導入)
- 言語: TypeScript

## 達成したいゴール
1. Drizzle ORMのインストールと初期設定（`drizzle.config.ts`の作成）。
2. 関心事の分離を意識したディレクトリ構造の構築。
3. 既存の生のSQLスキーマをDrizzleのTypeScriptスキーマ（`schema.ts`）へ変換。
4. DB接続クライアントの作成と、`index.ts`（Honoの起点）のリファクタリング。

## ステップごとの実行指示

### Step 1: 依存パッケージのインストール
以下のコマンドを実行して、Drizzle ORM関連のパッケージをインストールしてください。
```bash
npm i drizzle-orm
npm i -D drizzle-kit

Step 2: ディレクトリ構造の作成
src/ 配下を以下の構造に沿ってディレクトリと空ファイルを作成してください。

Plaintext
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
 └── index.ts
 
Step 3: Drizzleスキーマの定義 (src/infrastructure/db/schema.ts)
現在、schema.sql に定義されている users, places, visits, posts の4つのテーブルを、Drizzleのスキーマ定義（sqliteTableなどを使用）に変換して schema.ts に実装してください。

(※AIエディタへ: プロジェクトルートにある schema.sql の内容を読み込んで変換してください)

Step 4: DBクライアントの作成 (src/infrastructure/db/client.ts)
Cloudflare D1用のDrizzleクライアントを初期化し、エクスポートする処理を実装してください。HonoのContextから環境変数（D1のバインディング）を受け取れるように設計してください。

Step 5: drizzle.config.ts の作成
プロジェクトルートに drizzle.config.ts を作成し、src/infrastructure/db/schema.ts を読み込むように設定してください。出力先（out）は ./drizzle とします。

Step 6: エントリーポイントの修正 (src/index.ts)
既存の index.ts をクリーンアップし、Drizzleクライアントを呼び出して users テーブルのカウントを返す簡単なテスト用エンドポイント（/）を Hono で実装してください。

制約事項
オーバーエンジニアリングを避け、ハッカソンに間に合う「実用的な（Pragmatic）」コードを心がけてください。

型定義（Type）は可能な限りDrizzleから推論（InferSelectModelなど）させてください。