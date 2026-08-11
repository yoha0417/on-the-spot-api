import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";

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
	},
};
