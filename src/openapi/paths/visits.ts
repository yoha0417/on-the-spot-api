export const visitsPaths = {
	"/api/visits/{userId}": {
		get: {
			tags: ["Visits"],
			summary: "ユーザーの訪問履歴を取得",
			security: [{ BearerAuth: [] }],
			parameters: [
				{
					name: "userId",
					in: "path",
					required: true,
					schema: { type: "string" },
				},
			],
			responses: {
				"200": {
					description: "訪問履歴のリスト",
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									visits: {
										type: "array",
										items: { $ref: "#/components/schemas/VisitWithPlace" },
									},
								},
							},
						},
					},
				},
				"403": { description: "Forbidden" },
			},
		},
	},
};
