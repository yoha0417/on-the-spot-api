import type {
	D1Database,
	ExecutionContext,
	ScheduledEvent,
} from "@cloudflare/workers-types";
import { swaggerUI } from "@hono/swagger-ui";
import { Hono } from "hono";
import { createDb } from "./infrastructure/db/client";
import { VisitRepository } from "./infrastructure/repositories/visitRepository";
import { authController } from "./interface/controllers/authController";
import { checkInController } from "./interface/controllers/checkInController";
import { checkoutController } from "./interface/controllers/checkoutController";
import { heartbeatController } from "./interface/controllers/heartbeatController";
import { placeController } from "./interface/controllers/placeController";
import { postController } from "./interface/controllers/postController";
import { visitController } from "./interface/controllers/visitController";
import { authMiddleware } from "./middleware/authMiddleware";
import { openApiSchema } from "./openapi";
import { AutoCheckoutUsecase } from "./usecase/autoCheckoutUsecase";

// Cloudflare Workersの環境変数とHonoコンテキストの型定義
type Bindings = {
	DB: D1Database; // wrangler.jsonc の binding 名と一致させる
	JWT_SECRET: string;
};

type Variables = {
	db: ReturnType<typeof createDb>; // Drizzleインスタンスの型
	JWT_SECRET: string; // ここに string として定義！
	userId: string; // 追加
};

// 型を適用してHonoインスタンスを作成
const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Middleware to initialize DB connection and JWT secret
app.use(async (c, next) => {
	const db = c.env?.DB;
	const secret = c.env?.JWT_SECRET;

	if (!db || !secret) {
		return c.text("Configuration error", 500);
	}

	// Create Drizzle instance and set to context
	c.set("db", createDb(db));
	c.set("JWT_SECRET", secret as string);
	await next();
});

// --- 1. ミドルウェアの適用 ---
// ※ 末尾の /* を忘れないように注意してください！
app.use("/api/checkin/*", authMiddleware);
app.use("/api/heartbeat/*", authMiddleware);
app.use("/api/checkout/*", authMiddleware);
app.use("/api/posts/*", authMiddleware);
app.use("/api/visits/*", authMiddleware);

// --- 2. コントローラーの登録 ---
// 認証が必要なルート (上でミドルウェアを通ってからここに来る)
app.route("/api/checkin", checkInController);
app.route("/api/heartbeat", heartbeatController);
app.route("/api/checkout", checkoutController);
app.route("/api/posts", postController);
app.route("/api/visits", visitController);

// パブリックなルート (上に app.use が無いのでそのまま通る)
app.route("/api/auth", authController);
app.route("/api/places", placeController);

// グローバルなエラーハンドリング（予期せぬエラー用）
app.onError((err, c) => {
	console.error(`[Global Error] ${err.message}`);
	console.error(err.stack);
	return c.text("Internal Server Error", 500);
});

// Swagger UI
app.get("/docs", swaggerUI({ url: "/openapi.json" }));

// OpenAPI仕様
app.get("/openapi.json", (c) => {
	return c.json(openApiSchema);
});

export default {
	// ① HTTPリクエストのハンドラー
	fetch: app.fetch,

	// ② Cronバッチ（Scheduledイベント）のハンドラー
	scheduled: async (
		event: ScheduledEvent,
		env: Bindings,
		_ctx: ExecutionContext,
	) => {
		switch (event.cron) {
			case "*/10 * * * *": {
				console.log("[Cron] Auto-checkout process started...");
				const db = createDb(env.DB);
				const visitRepo = new VisitRepository(db);
				const usecase = new AutoCheckoutUsecase(visitRepo);

				// ハートビートが30分以上途絶えているものを自動チェックアウト
				const results = await usecase.execute(30);
				console.log(
					`[Cron] Auto-checkout completed. Checked out ${results.length} visits.`,
				);
				break;
			}
			default:
				console.log(`[Cron] Unhandled schedule: ${event.cron}`);
		}
	},
};
