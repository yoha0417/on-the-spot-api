export const openApiSchema = {
	openapi: "3.0.0",
	info: {
		title: "On The Spot API",
		version: "1.0.0",
		description: "位置情報連動型SNSのバックエンドAPI",
	},
	components: {
		securitySchemes: {
			BearerAuth: {
				type: "http",
				scheme: "bearer",
				bearerFormat: "JWT",
			},
		},
	},
	paths: {
		"/api/auth/register": {
			post: {
				tags: ["認証"],
				summary: "ユーザー登録",
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									email: {
										type: "string",
										format: "email",
										example: "user@example.com",
									},
									password: {
										type: "string",
										minLength: 8,
										example: "password123",
									},
									name: { type: "string", example: "田中太郎" },
								},
								required: ["email", "password", "name"],
							},
						},
					},
				},
				responses: {
					"200": {
						description: "登録成功",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										token: { type: "string" },
										user: {
											type: "object",
											properties: {
												id: { type: "string" },
												email: { type: "string" },
												name: { type: "string" },
											},
										},
									},
								},
							},
						},
					},
					"400": {
						description: "バリデーションエラー",
					},
					"409": {
						description: "メールアドレス重複",
					},
				},
			},
		},
		"/api/auth/login": {
			post: {
				tags: ["認証"],
				summary: "ログイン",
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									email: {
										type: "string",
										format: "email",
										example: "user@example.com",
									},
									password: { type: "string", example: "password123" },
								},
								required: ["email", "password"],
							},
						},
					},
				},
				responses: {
					"200": {
						description: "ログイン成功",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										token: { type: "string" },
										user: {
											type: "object",
											properties: {
												id: { type: "string" },
												email: { type: "string" },
												name: { type: "string" },
											},
										},
									},
								},
							},
						},
					},
					"401": {
						description: "認証失敗",
					},
				},
			},
		},
		"/api/places/nearby": {
			get: {
				tags: ["場所"],
				summary: "現在地付近の場所を検索",
				description:
					"指定された緯度・経度を中心に、指定された半径（デフォルト3000m）内の場所を取得します。",
				parameters: [
					{
						name: "lat",
						in: "query",
						required: true,
						description: "現在地の緯度",
						schema: { type: "number", example: 35.6895 },
					},
					{
						name: "lng",
						in: "query",
						required: true,
						description: "現在地の経度",
						schema: { type: "number", example: 139.6917 },
					},
					{
						name: "radius",
						in: "query",
						required: false,
						description: "検索半径（メートル）。0～10000。デフォルト3000",
						schema: { type: "number", minimum: 0, maximum: 10000, default: 3000 },
					},
				],
				responses: {
					"200": {
						description: "近隣の場所のリスト（距離順）",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										places: {
											type: "array",
											items: {
												type: "object",
												properties: {
													id: { type: "string" },
													name: { type: "string" },
													latitude: { type: "number" },
													longitude: { type: "number" },
													address: { type: "string", nullable: true },
													createdAt: {
														type: "string",
														format: "date-time",
													},
													distance: {
														type: "number",
														description: "現在地からの距離（メートル）",
													},
												},
												required: [
													"id",
													"name",
													"latitude",
													"longitude",
													"createdAt",
													"distance",
												],
											},
										},
										currentLocation: {
											type: "object",
											properties: {
												lat: { type: "number" },
												lng: { type: "number" },
											},
											required: ["lat", "lng"],
										},
										radius: { type: "number" },
									},
									required: ["places", "currentLocation", "radius"],
								},
							},
						},
					},
					"400": {
						description: "バリデーションエラー（lat,lngが数値でないなど）",
					},
				},
			},
		},
	},
};
