# 開発者向けガイドライン

## コントローラ作成時の原則

1. コントローラでは:
   - リクエストのバリデーションのみ行う
   - ビジネスロジックを書かない
   - Usecaseを呼び出して結果を返す
   - エラーハンドリングを行う

2. 良いコントローラの例:
```typescript
postController.get("/", async (c) => {
  const { placeId } = c.req.valid("query");
  const usecase = new PostUsecase(new PostRepository(db));
  const posts = await usecase.execute(placeId);
  return c.json({ posts });
});
```

## Usecase作成時の原則

1. Usecaseでは:
   - 1つのビジネスユースケースを実装
   - 複数リポジトリを協調させる
   - トランザクション管理を行う
   - ドメインルールを適用する

2. 良いUsecaseの例:
```typescript
class CreatePostUsecase {
  async execute(data: CreatePostInput) {
    // チェックイン済みか確認
    const visited = await this.visitRepo.findActiveVisit(data);
    if (!visited) throw new Error("Not checked in");
    
    // 投稿作成
    return this.postRepo.create(data);
  }
}
```

## リポジトリ作成時の原則

1. リポジトリでは:
   - 1つのデータソースへのアクセスを担当
   - 複雑なクエリを実装
   - キャッシュ戦略を実装
   - ドメインオブジェクトを返す

2. 良いリポジトリの例:
```typescript
class PostRepository {
  async findTimelinePosts(params: FindPostsParams) {
    return this.db.query(
      `SELECT * FROM posts 
       WHERE place_id = $1
       AND created_at <= $2`,
      [params.placeId, params.currentTime]
    );
  }
}
```

## Developer Commands
- `npm install` to set up dependencies
- `npm run dev` to start development server
- `npm run deploy` for deployment
- `npm run cf-typegen` to generate Cloudflare types

## Key Implementation Notes
- Hono app must be initialized with CloudflareBindings:
  ```ts
  const app = new Hono<{ Bindings: CloudflareBindings }>()
  ```
- Entry point: `src/index.ts`

# OpenCode Agent Instructions

## 1. コミュニケーションルール
* **言語の固定:** 以降のすべての対話、コード内のコメント、および解説において、**必ず日本語を使用してください**。
* **回答のスタイル:** ハッカソンでのMVP開発を最優先とし、冗長な挨拶や前置きは省略してください。即座に実装・検証可能なコードと、要点を絞った簡潔な説明のみを出力してください。

## 2. プロジェクト概要
* **プロジェクト名:** On The Spot (位置情報ベースのSNSアプリ)
* **目標:** 8月23日のハッカソン期限に向けたMVPの最速デリバリー。
* **アーキテクチャ:** 保守性と開発速度のバランスを取った「実用的なクリーンアーキテクチャ (Pragmatic Clean Architecture)」。

## 3. 技術スタックと制約
* **バックエンド:** Cloudflare Workers (Hono) + Cloudflare D1 (SQLite) + TypeScript。
* **ORM:** Drizzle ORM（※インポートパスは必ず `/d1` および `/sqlite-core` を使用し、ルートからのインポートは避けること）。
* **フロントエンド:** React Native (Expo) を用いたモバイルファースト設計。
* **実行環境の制約:** エッジ環境（Cloudflare Workers）での動作を前提とし、Node.js固有のネイティブモジュールや重い外部ライブラリは絶対に使用しないこと。

## 4. 重点機能の設計思想
* **位置情報の処理:** メモリとCPUの消費を抑えるため、D1（DB側）でのBounding Boxによる事前絞り込みと、Hono（API側）でのHaversine公式による正確な距離計算を組み合わせた「ハイブリッド判定方式」を採用すること。
* **バックグラウンド処理:** OSレベルのジオフェンス検知を主軸としつつ、Cloudflare WorkersのCRONトリガーによる定期的なデータクリーンアップをフェールセーフとして実装すること。

## 設定ファイルの制約 (Configuration File Rules)
* **Wrangler設定ファイルの指定:** Cloudflare Workersの設定ファイルには、`wrangler.toml` ではなく**必ず `wrangler.jsonc` を使用してください**。
* **新規作成の禁止:** コードの生成やセットアップの際、`wrangler.toml` を新しく作成しないこと。必ず既存の `wrangler.jsonc` を参照・編集してください。
