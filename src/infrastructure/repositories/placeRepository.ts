import { and, eq, sql } from "drizzle-orm";
import type { DbInstance } from "../db/client";
import { places } from "../db/schema";

export class PlaceRepository {
	constructor(private db: DbInstance) {}

	async findPlacesWithinBoundingBox(
		minLat: number,
		maxLat: number,
		minLng: number,
		maxLng: number,
	) {
		return await this.db
			.select()
			.from(places)
			.where(
				and(
					sql`${places.latitude} BETWEEN ${minLat} AND ${maxLat}`,
					sql`${places.longitude} BETWEEN ${minLng} AND ${maxLng}`,
				),
			);
	}

	async findByPlaceId(placeId: string) {
		const [place] = await this.db
			.select()
			.from(places)
			.where(eq(places.id, placeId));

		return place;
	}

	async findNearbyPlaces(lat: number, lng: number, radius = 3000) {
		const { minLat, maxLat, minLng, maxLng } = getBoundingBox(lat, lng, radius);

		const placesInBox = await this.db
			.select()
			.from(places)
			.where(
				and(
					sql`${places.latitude} BETWEEN ${minLat} AND ${maxLat}`,
					sql`${places.longitude} BETWEEN ${minLng} AND ${maxLng}`,
				),
			);

		return placesInBox;
	}
}
