import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { PlaceRepository } from "../../infrastructure/repositories/placeRepository";
import { calculateHaversineDistance, getBoundingBox } from "../../utils/geo";

export const placeController = new Hono();

placeController.get(
	"/nearby",
	zValidator(
		"query",
		z.object({
			lat: z.number(),
			lng: z.number(),
			radius: z.number().optional().default(3000),
		}),
	),
	async (c) => {
		const { lat, lng, radius } = c.req.valid("query");
		const db = c.get("db");
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
