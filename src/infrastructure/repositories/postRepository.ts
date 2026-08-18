import { and, desc, eq, isNotNull, lte, not, or, sql } from "drizzle-orm";
import type { DbInstance } from "../db/client";
import { likes, places, posts, users, visits } from "../db/schema";

export class PostRepository {
	constructor(private db: DbInstance) {}

	async findByPostId(postId: string) {
		const [post] = await this.db
			.select()
			.from(posts)
			.where(eq(posts.id, postId));
		return post;
	}

	async updateLikesCount(postId: string, count: number) {
		await this.db
			.update(posts)
			.set({ likesCount: count })
			.where(eq(posts.id, postId));
	}

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

	async findUserPosts(userId: string, currentTime: Date, viewerId: string) {
		const currentTimeIso = currentTime.toISOString();
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
						WHEN ${posts.userId} = ${viewerId} AND ${posts.isDelayedPublish} = true AND 
							 (${visits.checkedOutAt} IS NULL OR ${visits.checkedOutAt} > ${thresholdTime.toISOString()})
						THEN true
						ELSE false
					END
				`,
				stayDurationMinutes: sql<number>`
					ROUND(
						(
							julianday(COALESCE(${visits.checkedOutAt}, ${currentTimeIso}))
							- julianday(${visits.checkedInAt})
						) * 24 * 60
					)
				`,
				isMine: sql<boolean>`${posts.userId} = ${viewerId}`,
				likesCount: posts.likesCount,
				isLiked: sql<boolean>`
					EXISTS (
						SELECT 1 FROM ${likes} 
						WHERE ${likes.postId} = ${posts.id} AND ${likes.userId} = ${viewerId}
					)
				`,
				userName: users.name,
				placeName: places.name,
				placeAddress: places.address,
				placeLatitude: places.latitude,
				placeLongitude: places.longitude,
			})
			.from(posts)
			.leftJoin(visits, eq(posts.visitId, visits.id))
			.leftJoin(users, eq(posts.userId, users.id))
			.leftJoin(places, eq(posts.placeId, places.id))
			.where(eq(posts.userId, userId))
			.orderBy(desc(posts.createdAt));
	}

	async findTimelinePosts(params: {
		placeId: string;
		userId: string;
		currentTime: Date;
	}) {
		const { placeId, userId, currentTime } = params;
		const currentTimeIso = currentTime.toISOString();
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
				`,
				stayDurationMinutes: sql<number>`
					ROUND(
						(
							julianday(COALESCE(${visits.checkedOutAt}, ${currentTimeIso}))
							- julianday(${visits.checkedInAt})
						) * 24 * 60
					)
				`,
				isMine: sql<boolean>`${posts.userId} = ${userId}`,
				likesCount: posts.likesCount,
				isLiked: sql<boolean>`
					EXISTS (
						SELECT 1 FROM ${likes} 
						WHERE ${likes.postId} = ${posts.id} AND ${likes.userId} = ${userId}
					)
				`,
				userName: users.name,
			})
			.from(posts)
			.leftJoin(visits, eq(posts.visitId, visits.id))
			.leftJoin(users, eq(posts.userId, users.id))
			.where(
				and(
					eq(posts.placeId, placeId),
					or(
						// 自分の投稿
						eq(posts.userId, userId),
						// 他人の即時公開投稿
						and(
							not(eq(posts.userId, userId)),
							eq(posts.isDelayedPublish, false),
						),
						// 他人の遅延公開投稿（チェックアウトから30分以上経過）
						and(
							not(eq(posts.userId, userId)),
							eq(posts.isDelayedPublish, true),
							isNotNull(visits.checkedOutAt),
							lte(visits.checkedOutAt, thresholdTime.toISOString()),
						),
					),
				),
			)
			.orderBy(desc(posts.createdAt));
	}
}
