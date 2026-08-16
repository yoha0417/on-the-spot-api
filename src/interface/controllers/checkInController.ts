import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { DbInstance } from "../../infrastructure/db/client";
import { PlaceRepository } from "../../infrastructure/repositories/placeRepository"; // 適切なパスに合わせてください
import { VisitRepository } from "../../infrastructure/repositories/visitRepository";
import { CheckInUsecase } from "../../usecase/checkInUsecase";

// Variablesの型を定義して c.get('db') でエラーが出ないようにする
export const checkInController = new Hono<{
	Bindings: { JWT_SECRET: string };
	Variables: { db: DbInstance; userId: string };
}>();

// 1. Zodでリクエストボディの「スキーマ（期待する構造）」を定義
const checkInSchema = z.object({
	lat: z.number(), // 緯度の範囲も指定可能
	lng: z.number(), // 経度の範囲も指定可能
	placeId: z.string().min(1), // 1文字以上（空文字を弾く）
});

checkInController.post(
	"/",
	// 2. エンドポイントの処理の前に、zValidatorをミドルウェアとして挟む
	zValidator("json", checkInSchema, (result, c) => {
		// バリデーション失敗時の処理
		if (!result.success) {
			return c.json(
				{
					error: "Validation failed",
					details: result.error.issues, // 具体的にどこが間違っていたか配列で返せる
				},
				400,
			);
		}
	}),
	async (c) => {
		// 3. ここに来た時点で、リクエストは100%正しいことが保証されている！
		// c.req.valid("json") を使うと、型推論が効いた安全なデータを取得できます
		const { lat, lng, placeId } = c.req.valid("json");
		// 1. HonoのコンテキストからDBインスタンスを取得
		const db = c.get("db");
		if (!db) {
			throw new Error("DB instance is missing in Hono context");
		}

		const userId = c.get("userId");

		// 2. RepositoryにDBを渡し、UseCaseにRepositoryを渡す
		const placeRepository = new PlaceRepository(db);
		const visitRepository = new VisitRepository(db);
		const usecase = new CheckInUsecase(placeRepository, visitRepository);

		const result = await usecase.execute(lat, lng, placeId, userId);

		return c.json(result, 200);
	},
);
