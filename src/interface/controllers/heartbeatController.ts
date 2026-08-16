import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { DbInstance } from "../../infrastructure/db/client";
import { PlaceRepository } from "../../infrastructure/repositories/placeRepository";
import { VisitRepository } from "../../infrastructure/repositories/visitRepository";
import { HeartbeatUsecase } from "../../usecase/heartbeatUsecase";

export const heartbeatController = new Hono<{
	Bindings: { JWT_SECRET: string };
	Variables: { db: DbInstance; userId: string };
}>();

const heartbeatSchema = z.object({
	lat: z.number(),
	lng: z.number(),
	placeId: z.string().min(1),
});

heartbeatController.post(
	"/",
	zValidator("json", heartbeatSchema, (result, c) => {
		if (!result.success) {
			return c.json(
				{
					error: "Validation failed",
					details: result.error.issues,
				},
				400,
			);
		}
	}),
	async (c) => {
		const { lat, lng, placeId } = c.req.valid("json");
		const db = c.get("db");
		if (!db) {
			throw new Error("DB instance is missing in Hono context");
		}

		const userId = c.get("userId");

		const placeRepository = new PlaceRepository(db);
		const visitRepository = new VisitRepository(db);
		const usecase = new HeartbeatUsecase(placeRepository, visitRepository);

		const result = await usecase.execute(lat, lng, placeId, userId);

		if (result.status === "not_found") {
			return c.json(
				{ error: "Active visit not found or already checked out" },
				404,
			);
		}

		if (result.status === "checked_out") {
			return c.json(
				{
					success: false,
					status: "checked_out",
					message: "Force checked out due to distance limit",
				},
				200,
			);
		}

		return c.json({ success: true }, 200);
	},
);
