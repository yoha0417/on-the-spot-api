import type { VisitRepository } from "../infrastructure/repositories/visitRepository";

export class CheckoutUsecase {
	constructor(private visitRepo: VisitRepository) {}

	async execute(userId: string, placeId: string) {
		const visit = await this.visitRepo.findActiveVisitByUserAndPlace(
			userId,
			placeId,
		);
		if (!visit) {
			return { status: "not_found" as const };
		}
		await this.visitRepo.checkout(visit.id, new Date());
		return { status: "success" as const };
	}
}
