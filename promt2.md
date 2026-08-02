# タスク: 位置情報チェックイン/チェックアウト機能の実装（ハイブリッド判定方式）

現在構築中のクリーンアーキテクチャ基盤（Hono + Drizzle ORM + D1）の上で、ユーザーの現在地を用いたチェックイン・チェックアウト機能を実装してください。
Cloudflare Workersのメモリ・CPU制限を考慮し、DB側での事前絞り込みとHono側での正確な距離計算を組み合わせた「ハイブリッド方式」を採用します。

## 1. 前提条件と仕様
- **判定半径**: スポットから半径50m以内を「チェックイン圏内」とする。
- **データ構造**: `places` テーブルには緯度(`lat`)と経度(`lng`)が保存されている前提。
- **ハイブリッド方式のロジック**:
  1. **Bounding Box (D1側)**: 現在地の緯度経度から東西南北50mの境界箱（Bounding Box）を計算し、Drizzle ORMを用いてその範囲内のスポットのみをDBから取得する（高速化・メモリ節約）。
  2. **Haversine公式 (Hono側)**: 取得した候補スポットに対して、Usecase内で球面三角法（Haversine formula）を用いて正確な距離（メートル）を計算し、50m以内か判定する。

## 2. 実装ステップと対象レイヤー

### Step 1: Utils (共通関数) の作成
`src/utils/geo.ts` などのファイルを作成し、以下のロジックを実装してください。
- `getBoundingBox(lat, lng, distanceInMeters)`: 指定した緯度経度から四角形の境界（minLat, maxLat, minLng, maxLng）を返す関数。
- `calculateHaversineDistance(lat1, lng1, lat2, lng2)`: 2点間の正確な距離（メートル）を返す関数。

### Step 2: Repository層の実装
- `PlaceRepository` に、`findPlacesWithinBoundingBox(minLat, maxLat, minLng, maxLng)` メソッドを追加してください。
- Drizzle ORMの `between` 演算子を使用して、指定範囲内のスポット一覧を取得するクエリを実装してください。

### Step 3: Usecase層の実装
- `CheckInUsecase` を作成してください。
- ユーザーの現在地(`lat`, `lng`)を受け取り、Step 2のメソッドで近隣スポットを取得。
- 取得したスポットに対して Step 1の関数で正確な距離を計算し、50m以内のスポットがあれば `visits` テーブルにチェックイン記録（開始時刻など）を作成する処理を実装してください。

### Step 4: Controller層とRouterの実装
- `CheckInController` を作成し、Usecaseを呼び出す処理を記述してください。
- Honoのルーターに `POST /api/checkin` エンドポイントを追加し、リクエストボディから `lat`, `lng` を受け取れるようにしてください。

## 3. 制約事項
- エッジ環境（Cloudflare Workers）で動作するため、Node.js依存のネイティブモジュールは使用しないでください。
- 距離計算用の外部ライブラリ（geolibなど）は使わず、軽量化のために自前で計算関数（Utils）を実装してください。

実装が完了したら、エンドポイントのテスト方法（curlコマンド等の例）を教えてください。