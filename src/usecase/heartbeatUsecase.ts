import type { PlaceRepository } from "../infrastructure/repositories/placeRepository";
import type { VisitRepository } from "../infrastructure/repositories/visitRepository";
import { calculateHaversineDistance } from "../utils/geo";

export class HeartbeatUsecase {
	constructor(
		private placeRepo: PlaceRepository,
		private visitRepo: VisitRepository,
	) {}

	async execute(lat: number, lng: number, placeId: string) {
		const userId = "current-user-id";

		// 1. visits テーブルから該当ユーザーの status = 'active' かつ place_id = placeId のレコードを取得
		const visit = await this.visitRepo.findActiveVisitByUserAndPlace(
			userId,
			placeId,
		);
		if (!visit) {
			return { status: "not_found" as const };
		}

		// 2. スポット情報の取得
		const place = await this.placeRepo.findByPlaceId(placeId);
		if (!place) {
			return { status: "not_found" as const };
		}

		// 3. 現在地とスポットの距離を再計算
		const distance = calculateHaversineDistance(
			lat,
			lng,
			place.latitude,
			place.longitude,
		);

		// 50mを大きく超えている場合は強制チェックアウト処理へ回す（ここではバッファとして100m超とする）
		if (distance > 100) {
			await this.visitRepo.checkout(visit.id, new Date());
			return { status: "checked_out" as const };
		}

		// 4. 問題なければ last_heartbeat_at を更新
		await this.visitRepo.updateHeartbeat(visit.id, new Date());

		return { status: "success" as const };
	}
}
