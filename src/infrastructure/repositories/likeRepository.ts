import { and, eq, sql } from "drizzle-orm";
import type { DbInstance } from "../db/client";
import { likes } from "../db/schema";

export class LikeRepository {
	constructor(private db: DbInstance) {}

	async createLike(postId: string, userId: string) {
		const [like] = await this.db
			.insert(likes)
			.values({ postId, userId })
			.returning();
		return like;
	}

	async deleteLike(postId: string, userId: string) {
		await this.db
			.delete(likes)
			.where(and(eq(likes.postId, postId), eq(likes.userId, userId)));
	}

	async hasLiked(postId: string, userId: string) {
		const [like] = await this.db
			.select()
			.from(likes)
			.where(and(eq(likes.postId, postId), eq(likes.userId, userId)));
		return !!like;
	}

	async getLikesCount(postId: string): Promise<number> {
		const result = await this.db
			.select({ count: sql<number>`count(*)` })
			.from(likes)
			.where(eq(likes.postId, postId));
		return result[0]?.count ?? 0;
	}
}
