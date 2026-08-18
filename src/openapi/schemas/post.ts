export const postSchema = {
	type: "object",
	properties: {
		id: { type: "string", format: "uuid" },
		userId: { type: "string", format: "uuid" },
		placeId: { type: "string", format: "uuid" },
		visitId: { type: "string", format: "uuid" },
		content: { type: "string" },
		imageUrl: { type: "string", nullable: true },
		isDelayedPublish: { type: "boolean" },
		likesCount: { type: "integer" },
		createdAt: { type: "string", format: "date-time" },
	},
	required: [
		"id",
		"userId",
		"placeId",
		"visitId",
		"content",
		"isDelayedPublish",
		"likesCount",
		"createdAt",
	],
};
