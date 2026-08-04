# タイムライン取得機能 実装計画

## 1. 機能概要
- エンドポイント: `GET /api/timeline?placeId=<placeId>`
- 認証: ユーザー認証必須 (Bearer Token)
- レスポンス形式: JSON

## 2. 実装ステップ

### 2.1 データ層 (Repository)
- [x] `PostRepository.findTimelinePosts()` 実装完了
  - 複雑なクエリ条件を実装
  - `isWaitingForUnlock` フラグ計算
  - 新しい順ソート

### 2.2 ユースケース層
- [x] `GetTimelinePostsUsecase` 実装完了
  - ビジネスロジックのカプセル化
  - 入力バリデーション

### 2.3 APIエンドポイント
- [x] `/api/timeline` エンドポイント実装
  - クエリパラメータ検証
  - エラーハンドリング
  - レスポンスフォーマット

### 2.4 テストケース
- [ ] リポジトリ層のテスト
  - 各取得条件のテストケース
  - `isWaitingForUnlock` フラグのテスト
- [ ] ユースケース層のテスト
  - バリデーションのテスト
- [ ] APIエンドポイントのテスト
  - 正常系/異常系テスト

## 3. 技術的考慮事項

### クエリ最適化
- JOIN処理のパフォーマンス監視
- 適切なインデックス設定
  - `posts(placeId, createdAt)` 複合インデックス
  - `visits(checkedOutAt)` インデックス

### セキュリティ
- ユーザー認証の必須化
- クエリインジェクション対策 (Drizzle ORMで自動対応)

## 4. フロントエンド連携仕様

### レスポンス例
```json
{
  "data": [
    {
      "id": "post-123",
      "userId": "user-456",
      "content": "チェックインしました！",
      "isDelayedPublish": true,
      "createdAt": "2023-01-01T00:00:00Z",
      "isWaitingForUnlock": true,
      "unlockTime": "2023-01-01T00:30:00Z"
    }
  ]
}
```

### UI表示ルール
- `isWaitingForUnlock: true` の場合:
  - 🔒アイコン表示
  - 「この投稿はチェックアウト後30分で公開されます」メッセージ
  - カウントダウン表示 (unlockTime使用)

## 5. 今後の拡張予定
- ページネーション対応
- キャッシュ戦略の導入
- リアルタイム更新機能
