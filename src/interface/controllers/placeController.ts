import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { DbInstance } from "../../infrastructure/db/client";
import { PlaceRepository } from "../../infrastructure/repositories/placeRepository";
import { PlaceUsecase } from "../../usecase/placeUsecase";

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
				.min(0, "Radius must be at least 0 meters")
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
		const usecase = new PlaceUsecase(placeRepo);

		const places = await usecase.execute(lat, lng, radius);

		return c.json({
			places,
			currentLocation: { lat, lng },
			radius,
		});
	},
);
