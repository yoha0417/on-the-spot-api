import { Hono } from "hono";
import type { DbInstance } from "../../infrastructure/db/client";
import { VisitRepository } from "../../infrastructure/repositories/visitRepository";
import { GetUserVisitsUsecase } from "../../usecase/getUserVisitsUsecase";

export const visitController = new Hono<{
	Bindings: { JWT_SECRET: string };
	Variables: { db: DbInstance; userId: string };
}>();

visitController.get("/:userId", async (c) => {
	const requestedUserId = c.req.param("userId");
	const currentUserId = c.get("userId");

	if (requestedUserId !== currentUserId) {
		return c.json({ error: "Forbidden" }, 403);
	}

	const db = c.get("db");
	if (!db) {
		throw new Error("DB instance is missing in Hono context");
	}

	const visitRepo = new VisitRepository(db);
	const usecase = new GetUserVisitsUsecase(visitRepo);
	const visits = await usecase.execute(requestedUserId);

	return c.json({ visits });
});
