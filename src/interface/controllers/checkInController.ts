import { Hono } from "hono";
import type { DbInstance } from "../../infrastructure/db/client";
import { PlaceRepository } from "../../infrastructure/repositories/placeRepository"; // 適切なパスに合わせてください
import { VisitRepository } from "../../infrastructure/repositories/visitRepository";
import { CheckInUsecase } from "../../usecase/checkInUsecase";

// Variablesの型を定義して c.get('db') でエラーが出ないようにする
export const checkInController = new Hono<{ Variables: { db: DbInstance } }>();

checkInController.post("/", async (c) => {
	try {
		let body: { lat?: unknown; lng?: unknown; placeId?: unknown };
		try {
			body = await c.req.json();
		} catch {
			return c.json(
				{ error: "Validation failed", details: "Invalid JSON format" },
				400,
			);
		}

		const { lat, lng, placeId } = body;

		if (
			lat === undefined ||
			lat === null ||
			typeof lat !== "number" ||
			lng === undefined ||
			lng === null ||
			typeof lng !== "number" ||
			!placeId ||
			typeof placeId !== "string" ||
			placeId.trim() === ""
		) {
			return c.json(
				{
					error: "Validation failed",
					details:
						"Missing or invalid parameters. 'lat' (number), 'lng' (number), and 'placeId' (non-empty string) are required.",
				},
				400,
			);
		}

		// 1. HonoのコンテキストからDBインスタンスを取得
		const db = c.get("db");
		if (!db) {
			throw new Error("DB instance is missing in Hono context");
		}

		// 2. RepositoryにDBを渡し、UseCaseにRepositoryを渡す
		const placeRepository = new PlaceRepository(db);
		const visitRepository = new VisitRepository(db);
		const usecase = new CheckInUsecase(placeRepository, visitRepository);

		const result = await usecase.execute(lat, lng, placeId);

		return c.json(result, 200);
	} catch (error) {
		console.error("[Check-in Error]", error);
		const errorMessage = error instanceof Error ? error.message : String(error);
		return c.json({ error: "Check-in failed", details: errorMessage }, 500);
	}
});
