import type { PostRepository } from "../infrastructure/repositories/postRepository";
import type { VisitRepository } from "../infrastructure/repositories/visitRepository";

export class CreatePostUsecase {
	constructor(
		private visitRepo: VisitRepository,
		private postRepo: PostRepository,
	) {}

	async execute(data: {
		userId: string;
		placeId: string;
		content: string;
		isDelayedPublish: boolean;
	}) {
		// 1. 該当スポットにアクティブな滞在があるか確認
		const visit = await this.visitRepo.findActiveVisitByUserAndPlace(
			data.userId,
			data.placeId,
		);
		if (!visit) {
			return { status: "not_checked_in" as const };
		}

		// 2. 投稿を作成（visitId を自動紐付け）
		const post = await this.postRepo.createPost({
			userId: data.userId,
			placeId: data.placeId,
			visitId: visit.id,
			content: data.content,
			isDelayedPublish: data.isDelayedPublish,
		});

		return { status: "success" as const, post };
	}
}
