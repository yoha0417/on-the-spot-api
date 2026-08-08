import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { DbInstance } from "../../infrastructure/db/client";
import { PostRepository } from "../../infrastructure/repositories/postRepository";
import { VisitRepository } from "../../infrastructure/repositories/visitRepository";
import { CreatePostUsecase } from "../../usecase/createPostUsecase";

export const postController = new Hono<{ Variables: { db: DbInstance } }>();

const createPostSchema = z.object({
	content: z.string().min(1),
	placeId: z.string().min(1),
	is_delayed_publish: z.boolean(),
});

postController.post(
	"/",
	zValidator("json", createPostSchema, (result, c) => {
		if (!result.success) {
			return c.json(
				{ error: "Validation failed", details: result.error.issues },
				400,
			);
		}
	}),
	async (c) => {
		const { content, placeId, is_delayed_publish } = c.req.valid("json");
		const db = c.get("db");
		if (!db) {
			throw new Error("DB instance is missing in Hono context");
		}

		const visitRepository = new VisitRepository(db);
		const postRepository = new PostRepository(db);
		const usecase = new CreatePostUsecase(visitRepository, postRepository);

		const result = await usecase.execute({
			userId: "current-user-id", // TODO: 認証から取得
			placeId,
			content,
			isDelayedPublish: is_delayed_publish,
		});

		if (result.status === "not_checked_in") {
			return c.json({ error: "このスポットにチェックインしていません" }, 404);
		}

		return c.json({ success: true, post: result.post }, 201);
	},
);

postController.get("/", async (c) => {
	const placeId = c.req.query("placeId");
	if (!placeId) {
		return c.json({ error: "placeId query parameter is required" }, 400);
	}

	// TODO: Replace with actual auth user ID from JWT
	const userId = "temp-user-id"; // eslint-disable-line no-magic-numbers
	const currentTime = new Date();

	const db = c.get("db");
	const postRepo = new PostRepository(db);

	const posts = await postRepo.findTimelinePosts({
		placeId,
		userId,
		currentTime,
	});

	return c.json({
		posts,
		currentTime: currentTime.toISOString(),
	});
});
