import type { LikeRepository } from "../infrastructure/repositories/likeRepository";
import type { PostRepository } from "../infrastructure/repositories/postRepository";

export class LikePostUsecase {
	constructor(
		private likeRepo: LikeRepository,
		private postRepo: PostRepository,
	) {}

	async execute(postId: string, userId: string): Promise<number> {
		// 投稿存在チェック
		const post = await this.postRepo.findByPostId(postId);
		if (!post) {
			throw new Error("Post not found");
		}

		// すでにいいねしていたらいいね削除（トグル動作）
		if (await this.likeRepo.hasLiked(postId, userId)) {
			await this.likeRepo.deleteLike(postId, userId);
			const likesCount = await this.likeRepo.getLikesCount(postId);
			await this.postRepo.updateLikesCount(postId, likesCount);
			return likesCount;
		}

		// いいね作成
		await this.likeRepo.createLike(postId, userId);
		const likesCount = await this.likeRepo.getLikesCount(postId);
		await this.postRepo.updateLikesCount(postId, likesCount);
		return likesCount;
	}
}
