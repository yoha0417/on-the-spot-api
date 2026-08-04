import type { DbInstance } from "../db/client";
import { posts } from "../db/schema";

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
}
