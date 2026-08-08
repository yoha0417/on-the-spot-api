import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { DbInstance } from "../../infrastructure/db/client";
import { PlaceRepository } from "../../infrastructure/repositories/placeRepository";
import { calculateHaversineDistance } from "../../utils/geo";

export const placeController = new Hono<{ Variables: { db: DbInstance } }>();

placeController.get(
	"/nearby",
	zValidator(
		"query",
		z.object({
			lat: z.coerce.number().refine((val) => !Number.isNaN(val), {
				message: "Latitude must be a valid number",
			}),
			lng: z.coerce.number().refine((val) => !Number.isNaN(val), {
				message: "Longitude must be a valid number",
			}),
			radius: z.coerce
				.number()
				.min(100, "Radius must be at least 100 meters")
				.max(10000, "Radius cannot exceed 10,000 meters")
				.optional()
				.default(3000),
		}),
	),
	async (c) => {
		const { lat, lng, radius } = c.req.valid("query");
		const db = c.get("db");
		if (!db) {
			throw new Error("DB instance is missing in Hono context");
		}
		const placeRepo = new PlaceRepository(db);

		// Step 1: Get places within bounding box
		const placesInBox = await placeRepo.findNearbyPlaces(lat, lng, radius);

		// Step 2: Calculate exact distance and filter
		const placesWithDistance = placesInBox
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

		return c.json({
			places: placesWithDistance,
			currentLocation: { lat, lng },
			radius,
		});
	},
);
