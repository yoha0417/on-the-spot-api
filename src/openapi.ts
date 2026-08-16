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
		"/api/checkin": {
			post: {
				tags: ["チェックイン"],
				summary: "場所にチェックイン",
				description:
					"指定された緯度・経度が場所のチェックイン圏内（50m）にある場合、チェックインを記録します。JWT認証が必要です。",
				security: [{ BearerAuth: [] }],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									lat: {
										type: "number",
										description: "現在地の緯度",
										example: 35.6895,
									},
									lng: {
										type: "number",
										description: "現在地の経度",
										example: 139.6917,
									},
									placeId: {
										type: "string",
										description: "チェックイン先の場所ID",
										example: "some-uuid",
									},
								},
								required: ["lat", "lng", "placeId"],
							},
						},
					},
				},
				responses: {
					"200": {
						description: "チェックイン成功",
					},
					"400": {
						description: "バリデーションエラー",
					},
					"401": {
						description: "認証エラー",
					},
				},
			},
		},
		"/api/heartbeat": {
			post: {
				tags: ["チェックイン"],
				summary: "ハートビート（滞在継続通知）",
				description:
					"現在地がチェックイン圏内にあることを定期的に通知し、滞在ステータスを維持します。圏外の場合は強制チェックアウトされます。JWT認証が必要です。",
				security: [{ BearerAuth: [] }],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									lat: {
										type: "number",
										description: "現在地の緯度",
										example: 35.6895,
									},
									lng: {
										type: "number",
										description: "現在地の経度",
										example: 139.6917,
									},
									placeId: {
										type: "string",
										description: "滞在中の場所ID",
										example: "some-uuid",
									},
								},
								required: ["lat", "lng", "placeId"],
							},
						},
					},
				},
				responses: {
					"200": {
						description: "ハートビート成功（滞在継続 または 強制チェックアウト）",
						content: {
							"application/json": {
								schema: {
									oneOf: [
										{
											type: "object",
											properties: {
												success: {
													type: "boolean",
													enum: [true],
												},
											},
											description: "滞在継続",
										},
										{
											type: "object",
											properties: {
												success: {
													type: "boolean",
													enum: [false],
												},
												status: {
													type: "string",
													enum: ["checked_out"],
												},
												message: { type: "string" },
											},
											description: "圏外のため強制チェックアウト",
										},
									],
								},
							},
						},
					},
					"400": {
						description: "バリデーションエラー",
					},
					"401": {
						description: "認証エラー",
					},
					"404": {
						description: "アクティブな滞在が見つからない、または既にチェックアウト済み",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										error: { type: "string" },
									},
								},
							},
						},
					},
				},
			},
		},
		"/api/checkout": {
			post: {
				tags: ["チェックイン"],
				summary: "手動チェックアウト",
				description:
					"現在滞在中の場所から明示的にチェックアウトします。JWT認証が必要です。",
				security: [{ BearerAuth: [] }],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									placeId: {
										type: "string",
										description: "チェックアウトする場所のID",
										example: "some-uuid",
									},
								},
								required: ["placeId"],
							},
						},
					},
				},
				responses: {
					"200": {
						description: "チェックアウト成功",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										success: { type: "boolean", enum: [true] },
									},
								},
							},
						},
					},
					"400": {
						description: "バリデーションエラー",
					},
					"401": {
						description: "認証エラー",
					},
					"404": {
						description: "アクティブな滞在が見つからない、または既にチェックアウト済み",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										error: { type: "string" },
									},
								},
							},
						},
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
