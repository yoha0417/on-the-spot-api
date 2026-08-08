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

		// 重複いいねチェック
		// すでにいいねしていたらいいね削除
		if (await this.likeRepo.hasLiked(postId, userId)) {
			this.likeRepo.deleteLike(postId, userId);
			// いいね数更新
			const likesCount = await this.likeRepo.getLikesCount(postId);
			await this.postRepo.updateLikesCount(postId, likesCount);
		}

		// いいね作成
		await this.likeRepo.createLike(postId, userId);

		// いいね数更新
		const likesCount = await this.likeRepo.getLikesCount(postId);
		await this.postRepo.updateLikesCount(postId, likesCount);

		return likesCount;
	}
}
