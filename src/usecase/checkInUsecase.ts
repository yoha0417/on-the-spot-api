import type { PlaceRepository } from "../infrastructure/repositories/placeRepository";
import type { VisitRepository } from "../infrastructure/repositories/visitRepository";
import { calculateHaversineDistance } from "../utils/geo";

export class CheckInUsecase {
	// 修正箇所: = new ...() を削除し、外部から受け取ることを強制する
	constructor(
		private placeRepo: PlaceRepository,
		private visitRepo: VisitRepository,
	) {}

	async execute(lat: number, lng: number, placeId: string, userId: string) {
		// 1. Calculate bounding box
		const place = await this.placeRepo.findByPlaceId(placeId);
		if (!place) {
			throw new Error("Place not found");
		}

		const distance = calculateHaversineDistance(
			lat,
			lng,
			place.latitude,
			place.longitude,
		);
		if (distance > 1000) {
			throw new Error("チェックイン範囲外です");
		}

		const visit = await this.visitRepo.createChecknedIn({
			userId: userId,
			placeId,
			checked_in_at: new Date(),
			last_heartbeat_at: new Date(),
			status: "active",
		});

		return { success: true, visit };
	}
}
