export const postsPaths = {
	"/api/posts": {
		post: {
			tags: ["投稿"],
			summary: "投稿を作成",
			description:
				"チェックイン済みの場所に対して投稿を作成します。JWT認証が必要です。",
			security: [{ BearerAuth: [] }],
			requestBody: {
				required: true,
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: {
								content: { type: "string", example: "今日は晴れています" },
								placeId: { type: "string", format: "uuid" },
								is_delayed_publish: { type: "boolean", example: false },
							},
							required: ["content", "placeId", "is_delayed_publish"],
						},
					},
				},
			},
			responses: {
				"201": {
					description: "投稿作成成功",
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									success: { type: "boolean", enum: [true] },
									post: { $ref: "#/components/schemas/Post" },
								},
								required: ["success", "post"],
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
					description: "チェックインしていない場所への投稿",
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
		get: {
			tags: ["投稿"],
			summary: "場所のタイムライン投稿を取得",
			description:
				"指定された placeId のタイムライン投稿を取得します。JWT認証が必要です。",
			security: [{ BearerAuth: [] }],
			parameters: [
				{
					name: "placeId",
					in: "query",
					required: true,
					description: "タイムラインを取得する場所のID",
					schema: { type: "string", format: "uuid" },
				},
			],
			responses: {
				"200": {
					description: "投稿一覧",
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									posts: {
										type: "array",
										items: {
											type: "object",
											properties: {
												id: { type: "string", format: "uuid" },
												userId: { type: "string", format: "uuid" },
												placeId: { type: "string", format: "uuid" },
												visitId: { type: "string", format: "uuid" },
												content: { type: "string" },
												isDelayedPublish: { type: "boolean" },
												createdAt: { type: "string", format: "date-time" },
												isWaitingForUnlock: { type: "boolean" },
												stayDurationMinutes: {
													type: "number",
													description:
														"その投稿の元となった訪問の滞在時間（分）。チェックアウトしていない場合は現在時刻までの時間。",
												},
												isMine: { type: "boolean" },
												likesCount: { type: "integer" },
												isLiked: { type: "boolean" },
												userName: { type: "string" },
											},
											required: [
												"id",
												"userId",
												"placeId",
												"visitId",
												"content",
												"isDelayedPublish",
												"createdAt",
												"isWaitingForUnlock",
												"stayDurationMinutes",
												"isMine",
												"likesCount",
												"isLiked",
												"userName",
											],
										},
									},
									currentTime: {
										type: "string",
										format: "date-time",
									},
								},
								required: ["posts", "currentTime"],
							},
						},
					},
				},
				"400": {
					description: "placeId クエリパラメータが不足",
				},
				"401": {
					description: "認証エラー",
				},
			},
		},
	},
	"/api/posts/user/{userId}": {
		get: {
			tags: ["投稿"],
			summary: "ユーザーの投稿一覧を取得",
			description:
				"指定された userId の投稿一覧を取得します。JWT認証が必要です。",
			security: [{ BearerAuth: [] }],
			parameters: [
				{
					name: "userId",
					in: "path",
					required: true,
					description: "投稿を取得するユーザーID",
					schema: { type: "string", format: "uuid" },
				},
			],
			responses: {
				"200": {
					description: "投稿一覧",
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									posts: {
										type: "array",
										items: { $ref: "#/components/schemas/Post" },
									},
								},
								required: ["posts"],
							},
						},
					},
				},
				"401": {
					description: "認証エラー",
				},
			},
		},
	},
	"/api/posts/{postId}/like": {
		post: {
			tags: ["投稿"],
			summary: "投稿にいいね（トグル）",
			description:
				"指定された投稿に対していいねをトグルします。既にいいね済みの場合は取り消し、未いいねの場合は追加します。JWT認証が必要です。",
			security: [{ BearerAuth: [] }],
			parameters: [
				{
					name: "postId",
					in: "path",
					required: true,
					description: "いいね対象の投稿ID",
					schema: { type: "string", example: "some-uuid" },
				},
			],
			responses: {
				"200": {
					description: "いいね成功（追加または削除）",
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									success: { type: "boolean", enum: [true] },
									likesCount: {
										type: "number",
										description: "更新後のいいね数",
									},
								},
								required: ["success", "likesCount"],
							},
						},
					},
				},
				"401": {
					description: "認証エラー",
				},
				"404": {
					description: "投稿が見つからない",
				},
			},
		},
	},
};
