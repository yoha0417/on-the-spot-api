import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { DbInstance } from "../../infrastructure/db/client";
import { LikeRepository } from "../../infrastructure/repositories/likeRepository";
import { PostRepository } from "../../infrastructure/repositories/postRepository";
import { VisitRepository } from "../../infrastructure/repositories/visitRepository";
import { CreatePostUsecase } from "../../usecase/createPostUsecase";
import { LikePostUsecase } from "../../usecase/likePostUsecase";
import { PostUsecase } from "../../usecase/postUsecase";

export const postController = new Hono<{
	Bindings: { JWT_SECRET: string };
	Variables: { db: DbInstance; userId: string };
}>();

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

		const userId = c.get("userId");
		const visitRepository = new VisitRepository(db);
		const postRepository = new PostRepository(db);
		const usecase = new CreatePostUsecase(visitRepository, postRepository);

		const result = await usecase.execute({
			userId: userId,
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

	const userId = c.get("userId");
	const currentTime = new Date();

	const db = c.get("db");
	const postRepo = new PostRepository(db);
	const postUsecase = new PostUsecase(postRepo);

	const posts = await postUsecase.executeGetTimelinePosts(
		placeId,
		userId,
		currentTime,
	);

	return c.json({
		posts,
		currentTime: currentTime.toISOString(),
	});
});

// ユーザーの投稿を取得
postController.get("/user/:userId", async (c) => {
	const userId = c.req.param("userId");
	const db = c.get("db");
	const postRepo = new PostRepository(db);
	const postUsecase = new PostUsecase(postRepo);
	const currentTime = new Date();

	const authUserId = c.get("userId");
	const userPosts = await postUsecase.execute(userId, currentTime, authUserId);

	return c.json({
		posts: userPosts,
		currentTime: currentTime.toISOString(),
	});
});

// いいね機能追加
postController.post("/:postId/like", async (c) => {
	const postId = c.req.param("postId");
	const userId = c.get("userId");
	const db = c.get("db");

	const likeRepo = new LikeRepository(db);
	const postRepo = new PostRepository(db);
	const usecase = new LikePostUsecase(likeRepo, postRepo);

	try {
		const likesCount = await usecase.execute(postId, userId);
		return c.json({ success: true, likesCount });
	} catch (e) {
		if (e instanceof Error) {
			if (e.message === "Post not found") {
				return c.json({ error: "Post not found" }, 404);
			}
			if (e.message === "Already liked") {
				return c.json({ error: "Already liked" }, 409);
			}
		}
		return c.json({ error: "Internal server error" }, 500);
	}
});
