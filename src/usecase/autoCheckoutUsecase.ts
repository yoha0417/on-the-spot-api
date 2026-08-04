import type { VisitRepository } from "../infrastructure/repositories/visitRepository";

export class AutoCheckoutUsecase {
	constructor(private visitRepo: VisitRepository) {}

	async execute(expirationMinutes: number = 30) {
		const now = new Date();
		// 期限切れ判定の基準時間
		const threshold = new Date(now.getTime() - expirationMinutes * 60 * 1000);

		// 期限切れのアクティブ滞在を自動チェックアウト
		const checkedOutVisits = await this.visitRepo.autoCheckoutExpiredVisits(
			threshold,
			now,
		);

		return checkedOutVisits;
	}
}
