import type { VisitRepository } from "../infrastructure/repositories/visitRepository";

export class GetUserVisitsUsecase {
	constructor(private visitRepo: VisitRepository) {}

	async execute(userId: string) {
		const visits = await this.visitRepo.findVisitsWithPlaceByUserId(userId);

		return visits.map((v) => {
			const checkedIn = new Date(v.checkedInAt).getTime();
			const checkedOut = v.checkedOutAt
				? new Date(v.checkedOutAt).getTime()
				: Date.now();

			return {
				visitId: v.visitId,
				checkedInAt: v.checkedInAt,
				checkedOutAt: v.checkedOutAt ?? null,
				status: v.status,
				durationMinutes: Math.round((checkedOut - checkedIn) / 60000),
				place: {
					id: v.placeId,
					name: v.placeName,
					latitude: v.placeLatitude,
					longitude: v.placeLongitude,
					address: v.placeAddress,
				},
			};
		});
	}
}
