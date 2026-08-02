# チェックインAPIのcurl疎通テスト計画

チェックインAPI（`POST /api/checkin`）をローカル環境で検証するための手順と、正しい `curl` コマンドの計画です。

## Goal Description
APIを `curl` コマンドでテストするにあたり、リクエストパラメータに必要な `placeId` が不足しているため、これを追加した正しい `curl` コマンドを提供します。また、テストが成功するようにローカルデータベースへテストデータを投入（シード）し、ローカルサーバーを起動する手順を整理します。

## Open Questions
ローカルDBの初期化やマイグレーションは既に完了していますでしょうか？
もし未完了の場合は、以下の手順の前にマイグレーションを行う必要があります。

## Proposed Steps

### 1. ローカルデータベースへのテストデータ（シード）投入
[seed.ts](file:///Users/yoshitohama/work/on-the-spot-api/scripts/seed.ts) に定義されているテストデータをローカル SQLite (D1) に投入します。これにより、テストに必要なユーザー（`current-user-id`）と場所（`place_1`, `place_2`, `place_3`）が作成されます。
```bash
npx tsx scripts/seed.ts
```

> [!NOTE]
> ローカルDBファイルが存在しない場合は、一度サーバーを起動してリクエストを送信するか、 wrangler 経由で DB を作成した後に上記コマンドを実行してください。

### 2. ローカルサーバーの起動
APIサーバーを起動します。
```bash
npm run dev
```

### 3. curl コマンドによる疎通確認

`placeId` をリクエストボディに追加した `curl` コマンドを実行します。

#### パターンA: 成功ケース (50m以内のチェックイン)
シードデータ `place_1`（都庁前広場: `latitude: 35.6896, longitude: 139.6917`）に対して、距離が約11mの座標を指定してチェックインします。

```bash
curl -X POST http://localhost:8787/api/checkin \
  -H "Content-Type: application/json" \
  -d '{"lat": 35.6895, "lng": 139.6917, "placeId": "place_1"}'
```

#### パターンB: 失敗ケース (50m圏外のチェックイン)
シードデータ `place_3`（新宿駅西口: `latitude: 35.6905, longitude: 139.6950`）に対して、距離が50mを超える座標を指定してチェックインを試みます（「チェックイン範囲外です」というエラーが返ります）。

```bash
curl -X POST http://localhost:8787/api/checkin \
  -H "Content-Type: application/json" \
  -d '{"lat": 35.6895, "lng": 139.6917, "placeId": "place_3"}'
```

## Verification Plan
上記の curl コマンドを実際に実行し、期待されるレスポンス（パターンAでは success、パターンBでは 500 エラーかつ「チェックイン範囲外です」）が返却されることを確認します。
