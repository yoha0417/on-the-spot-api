import type { PlaceRepository } from "../infrastructure/repositories/placeRepository";
import { calculateHaversineDistance } from "../utils/geo";

export class PlaceUsecase {
	constructor(private placeRepo: PlaceRepository) {}

	async execute(lat: number, lng: number, radius: number) {
		// Step 1: Get places within bounding box
		const placesInBox = await this.placeRepo.findNearbyPlaces(lat, lng, radius);

		// Step 2: Calculate exact distance and filter
		return placesInBox
			.map((place) => ({
				...place,
				distance: calculateHaversineDistance(
					lat,
					lng,
					place.latitude,
					place.longitude,
				),
			}))
			.filter((place) => place.distance <= radius)
			.sort((a, b) => a.distance - b.distance);
	}
}
