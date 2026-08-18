import type { PostRepository } from "../infrastructure/repositories/postRepository";

export class PostUsecase {
	constructor(private postRepo: PostRepository) {}

	async executeGetTimelinePosts(
		placeId: string,
		userId: string,
		currentTime: Date,
	) {
		return this.postRepo.findTimelinePosts({
			placeId,
			userId,
			currentTime,
		});
	}

	async execute(userId: string, currentTime: Date, viewerId = userId) {
		return this.postRepo.findUserPosts(userId, currentTime, viewerId);
	}
}
