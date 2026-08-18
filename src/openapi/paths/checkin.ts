export const checkinPaths = {
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
					description:
						"アクティブな滞在が見つからない、または既にチェックアウト済み",
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
					description:
						"アクティブな滞在が見つからない、または既にチェックアウト済み",
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
};
