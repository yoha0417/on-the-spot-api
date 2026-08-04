import type { DbInstance } from "../db/client";
import { posts, visits } from "../db/schema";
import { and, or, eq, not, isNotNull, lte, desc, sql } from "drizzle-orm";

export class PostRepository {
	constructor(private db: DbInstance) {}

	async createPost(data: {
		userId: string;
		placeId: string;
		visitId: string;
		content: string;
		isDelayedPublish: boolean;
	}) {
		const [result] = await this.db
			.insert(posts)
			.values({
				userId: data.userId,
				placeId: data.placeId,
				visitId: data.visitId,
				content: data.content,
				isDelayedPublish: data.isDelayedPublish,
			})
			.returning();
		return result;
	}

	async findTimelinePosts(params: {
		placeId: string;
		userId: string;
		currentTime: Date;
	}) {
		const { placeId, userId, currentTime } = params;
		const thresholdTime = new Date(currentTime.getTime() - 30 * 60 * 1000); // 30分前
		
		return await this.db
			.select({
				id: posts.id,
				userId: posts.userId,
				placeId: posts.placeId,
				visitId: posts.visitId,
				content: posts.content,
				isDelayedPublish: posts.isDelayedPublish,
				createdAt: posts.createdAt,
				isWaitingForUnlock: sql<boolean>`
					CASE
						WHEN ${posts.userId} = ${userId} AND ${posts.isDelayedPublish} = true AND 
							 (${visits.checkedOutAt} IS NULL OR ${visits.checkedOutAt} > ${thresholdTime.toISOString()})
						THEN true
						ELSE false
					END
				`
			})
			.from(posts)
			.leftJoin(visits, eq(posts.visitId, visits.id))
			.where(
				and(
					eq(posts.placeId, placeId),
					or(
						// 自分の投稿
						eq(posts.userId, userId),
						// 他人の即時公開投稿
						and(
							not(eq(posts.userId, userId)),
							eq(posts.isDelayedPublish, false)
						),
						// 他人の遅延公開投稿（チェックアウトから30分以上経過）
						and(
							not(eq(posts.userId, userId)),
							eq(posts.isDelayedPublish, true),
							isNotNull(visits.checkedOutAt),
							lte(visits.checkedOutAt, thresholdTime.toISOString())
						)
					)
				)
			)
			.orderBy(desc(posts.createdAt));
	}
}
