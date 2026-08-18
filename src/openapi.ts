import { postSchema } from "./openapi/schemas/post";
import { authPaths } from "./openapi/paths/auth";
import { checkinPaths } from "./openapi/paths/checkin";
import { postsPaths } from "./openapi/paths/posts";
import { placesPaths } from "./openapi/paths/places";

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
		schemas: {
			Post: postSchema,
		},
	},
	paths: {
		...authPaths,
		...checkinPaths,
		...postsPaths,
		...placesPaths,
	},
};
