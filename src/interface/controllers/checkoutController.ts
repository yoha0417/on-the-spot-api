import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { DbInstance } from "../../infrastructure/db/client";
import { VisitRepository } from "../../infrastructure/repositories/visitRepository";
import { CheckoutUsecase } from "../../usecase/checkoutUsecase";

export const checkoutController = new Hono<{
	Bindings: { JWT_SECRET: string };
	Variables: { db: DbInstance; userId: string };
}>();

const checkoutSchema = z.object({
	placeId: z.string().min(1),
});

checkoutController.post(
	"/",
	zValidator("json", checkoutSchema, (result, c) => {
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
		const { placeId } = c.req.valid("json");
		const db = c.get("db");
		if (!db) {
			throw new Error("DB instance is missing in Hono context");
		}

		const userId = c.get("userId");

		const visitRepository = new VisitRepository(db);
		const usecase = new CheckoutUsecase(visitRepository);

		const result = await usecase.execute(userId, placeId);

		if (result.status === "not_found") {
			return c.json(
				{ error: "Active visit not found or already checked out" },
				404,
			);
		}

		return c.json({ success: true }, 200);
	},
);
